var Lourah = Lourah || {};
Lourah.js3d = Lourah.js3d || {};

Lourah.js3d.id = (row, col) => ([0,3,6][row] + col);

Lourah.js3d.spheric = (rho, lat, longit) =>     
     { var slat = Math.sin(lat);
        return [ rho*slat*Math.cos(longit)
                     ,rho*slat*Math.sin(longit)
                     ,rho*Math.cos(lat)]
     };
     
Lourah.js3d.translate = (p, v) => (
	[p[0] + v[0],  p[1] + v[1], p[2] + v[2]]
	);
	
Lourah.js3d.rotate = (m, p) => ( m===null?p:
	[ m[0]*p[0] + m[1]*p[1] + m[2]*p[2]
	, m[3]*p[0] + m[4]*p[1] + m[5]*p[2]
	, m[6]*p[0] + m[7]*p[1] + m[8]*p[2]]
	);
	
	Lourah.js3d.m3x3 = (m, p) => (
		[ m[0]*p[0] + m[1]*p[3] + m[2]*p[6], m[0]*p[1] + m[1]*p[4] + m[2]*p[7], m[0]*p[2] + m[1]*p[5] + m[2]*p[8]
		, m[3]*p[0] + m[4]*p[3] + m[5]*p[6], m[3]*p[1] + m[4]*p[4] + m[5]*p[7], m[3]*p[2] + m[4]*p[5] + m[5]*p[8]
		,m[6]*p[0] + m[7]*p[3] + m[8]*p[6], m[6]*p[1] + m[7]*p[4] + m[8]*p[7], m[6]*p[2] + m[7]*p[5] + m[8]*p[8] ]
	);
	
	Lourah.js3d.rot = (a, b, c) => {
		var [ ca, sa, cb, sb, cc, sc ] = [
		       Math.cos(a), Math.sin(a)
		     , Math.cos(b), Math.sin(b)
		     , Math.cos(c), Math.sin(c) ];
		     //console.log([ ca, sa, cb, sb, cc, sc ]);
		return [
	        	cb*cc, -sc*cb, sb,
	        	sa*sb*cc + ca*sc, -sa*sb*sc + ca*cc, -sa*cb,
	        	-ca*sb*cc + sa*sc, ca*sb*sc + sa*cc, ca*cb
		];
		/*[
		cc*cb,  cc*sb*sa - sc*sa, cc*sb*ca + sc*sa,
		sc*cb,  sc*sb*sa + cc*ca, sc*sb*ca - cc*sa,
		-sb, cb*sa, cb*ca
		];
		*/
	}

Lourah.js3d.rotCalc = (a, b, c) =>(
	Lourah.js3d.m3x3(
		Lourah.js3d.m3x3(Lourah.js3d.rot(0,0,c), Lourah.js3d.rot(0,b,0)),
		Lourah.js3d.rot(a, 0, 0)
		)
	);

Lourah.js3d.dump = (m) => {
	 console.log("m::" + m);
};

Lourah.js3d.transform = (p, rot, t) => (
	Lourah.js3d.rotate(rot
		                        , Lourah.js3d.translate(p,t))
	);
	

Lourah.js3d.Rad2Deg = 180/Math.PI;
Lourah.js3d.Deg2Rad = Math.PI/180;

Lourah.js3d.transformDeg = (p, t, a, b, c) => (
	Lourah.js3d.transform(p, t, a*Lourah.js3d.Deg2Rad, b*Lourah.js3d.Deg2Rad, c*Lourah.js3d.Deg2Rad)
	);
	
Lourah.js3d.to2d = (p, c) => ([
	(p[0] - c[0])*(c[2]/(p[2] + c[2])) + c[0],
	(p[1] - c[1])*(c[2]/(p[2] + c[2])) + c[1]
	]);

Lourah.js3d.toScreen = (p, dim) => ([
	dim[0]/2 + p[0],
	dim[1]/2 - p[1]
	]);


Lourah.js3d.project = (p, camera, screenDimension) => (
	Lourah.js3d.toScreen(
	     Lourah.js3d.to2d(p, camera)
	      , screenDimension
	   )
	);

Lourah.js3d.Renderer = function(width, height) {
	var zP = new Array(width * height);
	var diagonal = Math.sqrt(width*width + height*height);
	
	var storePoint = (p, color, rotation, translation, camera) => {
		var pr = Lourah.js3d.transform(p, rotation, translation);
		var p2 = Lourah.js3d.project(pr, camera, [width, height]);
		if (p2[0] < 0 || p2[0] > width) return;
		if (p2[1] < 0 || p2[1] > height) return;
		var wP = (p2[0]|0) + (p2[1]|0)*width;
		if (zP[wP] === undefined || zP[wP].z <= pr[2]) {
			zP[wP] = {
				   z:pr[2]
                  ,point:p
                  ,transformed:pr
                  ,projected:p2
                  ,color:color
                  ,i:wP
                  };
			}
		}
	
	this.shape = (ap, color, rotation, translation, camera) => {
		ap.forEach(p => storePoint(p, color, rotation, translation, camera));
		};
		
	this.buildLine = (p1, p2) => {
		var d = Math.max(...p1.map((p, i) => (
		   Math.abs(p2[i] - p1[i])
		   )));
		var step = 1/d;
		ret = new Array(d|0);
		var count = 0;
		for(var t = 0; t < 1; t+= step) {
		   ret[count++] = [
			  (p2[0] - p1[0])*t + p1[0]
			, (p2[1] - p1[1])*t + p1[1]
			, (p2[2] - p1[2])*t + p1[2]
			];
		}
		//console.log("count::" + count);
		return ret;
	};
    
	    this.line = (p1, p2, color, rotation, translation, camera) => {
		   this.buildLine(p1, p2).forEach(p => storePoint(p, color, rotation, translation, camera));
		}
		
		this.polyLine = (ap, color, rotation, translation, camera) => {
			ap.forEach((p, i) => {
				if (i === ap.length - 1) return;
				this.line(ap[i], ap[i+1], color, rotation, translation, camera);
				});
			};
			
		this.polygon =  (ap, color, rotation, translation, camera) => {
			this.polyLine([...ap, ap[0]], color, rotation, translation, camera);
			};
		
		this.vector = (p1, p2) => [
		p2[0] - p1[0],
		p2[1] - p1[1],
		p2[2] - p1[2]
		];
		
		
		this.vectorialProduct = (v1, v2) => [
		v1[1]*v2[2] - v1[2]*v2[1],
		v1[2]*v2[0] - v1[0]*v2[2],
		v1[0]*v2[1] - v1[1]*v2[0]
		];
		
		this.scalarProduct = (v1, v2) => (
		   v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2]
		);
		
		
		this.norm = v => Math.sqrt(this.scalarProduct(v, v));
		
		
		this.normalize = v => {
			var norm = this.norm(v);
			return [ v[0]/norm, v[1]/norm, v[2]/norm ];
			}
		
		
		this.txel = (p1, p2, p3, color, rotation, translation, camera, spot) => {
			//console.log("txel::" + [p1, p2, p3]);
			var [pr1, pr2, pr3] = [p1, p2, p3].map(p => Lourah.js3d.rotate(rotation, p));
			
			var [[l1,v1], [l2,v2], [l3,v3]] = [
			   [this.buildLine(p1, p2), this.vector(pr1, pr2)]
			  ,[this.buildLine(p2, p3), this.vector(pr2, pr3)]
			  ,[this.buildLine(p3, p1), this.vector(pr3, pr1)]
			  ].sort((a,b) => b[0].length - a[0].length);
			 
			 //[l1, l2, l3].forEach((l, i) => console.log("l::" + i + "::" + l.length));
			
			if (spot === undefined) spot = [0, 0, 1];
			var ortho = this.normalize(this.vectorialProduct(v1, v2));
			var lambda = this.scalarProduct(ortho, this.normalize(spot));
			//console.log("lambda::" + lambda);
			//lambda = Math.abs(lambda);
			var colorSpot = color.map((c,i) => {
				if (i === 3) return c;
				return (lambda + 1)*c/2;
				});
			
			 l1.forEach((p, i) => {
				/* go from l1 to l2 follow l3 */
				if (i < l3.length) {
					this.line(l1[i], l3[l3.length - i -1], colorSpot, rotation, translation, camera);
					} else {
					this.line(l1[i], l2[l2.length - i + l3.length], colorSpot, rotation, translation, camera);
					}
				});
			};
		
		this.flush = (imageData) => {
			//var imageData = new ImageData(width, height);
			//var size = width*height;
			var count = 0;
			zP.forEach( (z, i) => {
				count++;
				for(var j = 0; j<4; j++) {
						  imageData.data[i*4 + j] = z.color[j];
						}
				}
				);
			//console.log("zP::count::" + count);
			return imageData;
		};
		
		this.display = () => (zP);
	};

Lourah.js3d.color = Lourah.js3d.color || {};

Lourah.js3d.color.negative = ([r,g,b,a=255]) => (
  [255 - r, 255 - g, 255 - b, a]
);

Lourah.js3d.color.rgb = (r, g, b) => ([r, g, b, 255]);
Lourah.js3d.color.rgba = (r, g, b, a) => ([r, g, b, a]);


Lourah.js3d.test = () => {
	var p = Lourah.js3d.transformDeg(
	 [10, 50, 100]
	,[0, 0, 0]
	,0
	,0
	,90);

console.log(p);
var p2d;
console.log(p2d = Lourah.js3d.to2d(p, [
	0
	,0
	,1500
	]));

console.log(Lourah.js3d.toScreen(p2d, [340, 400]));

};
