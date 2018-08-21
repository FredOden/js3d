/**

Lourah.js3d (c) Frederic Oden

fred.oden@gmail.com


**/

var Lourah = Lourah || {};
Lourah.js3d = Lourah.js3d || {};

try {
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

Lourah.js3d.transform = (p, rotation, translation) => {
	/*
	cached transformed point in p.pr
	with attributes p.r : rotation and p.t : translation
	*/
	if (p.r === rotation && p.t === translation) return p.pr
    p.r = rotation;
    p.t = translation;
    return p.pr = Lourah.js3d.rotate(rotation
		                    , Lourah.js3d.translate(p, translation));
	
	};
	

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


Lourah.js3d.project = (p, camera, screenDimension) => {
	  /*
	  cached projected transformed point in p.p2d
	  with attribute p.c : camera
	  */
      if(p.c === camera) return p.p2d;
      p.c = camera;
	  return p.p2d = Lourah.js3d.toScreen(
	                              Lourah.js3d.to2d(p, camera)
	                                , screenDimension);
	
	};

Lourah.js3d.Renderer = function(width, height) {
	var zP = new Array(width * height);
	var diagonal = Math.sqrt(width*width + height*height);
	

	var storePoint2d = w => {
		if (w.p2[0] < 0 || w.p2[0] > width) return;
		if (w.p2[1] < 0 || w.p2[1] > height) return;
		var wP = (w.p2[0]|0) + (w.p2[1]|0)*width;
		if (zP[wP] === undefined || zP[wP].z <= w.z) {
			zP[wP] = {
				   z:w.z
                  //,transformed:pr
                  //,projected:w.p2
                  ,color:w.color
                  ,i:wP
                  };
			}
		}
	
	var storePoint3d = (p, color, rotation, translation, camera) => {
		var pr = Lourah.js3d.transform(p, rotation, translation);
		var p2 = Lourah.js3d.project(pr, camera, [width, height]);
		if (p2[0] < 0 || p2[0] > width) return;
		if (p2[1] < 0 || p2[1] > height) return;
		var wP = (p2[0]|0) + (p2[1]|0)*width;
		if (zP[wP] === undefined || zP[wP].z <= pr[2]) {
			zP[wP] = {
				   z:pr[2]
                  //,point:p
                  //,transformed:pr
                  //,projected:p2
                  ,color:color
                  ,i:wP
                  };
			}
		}
	
	this.shape = (ap, color, rotation, translation, camera) => {
		ap.forEach(p => storePoint3d(p, color, rotation, translation, camera));
		};
		
		
	this.sqrt2 = Math.sqrt(2);
	
	
	this.buildLine2d = (p2d1, p2d2, z1, z2, color) => {
		var d = 0;
		
		var v = [p2d2[0] - p2d1[0], p2d2[1] - p2d1[1]];
		/*
		d = (v[0] < 0)?((-v[0] > d)?-v[0]:d):((v[0] > d)?v[0]:d);
		d = (v[1] < 0)?((-v[1] > d)?-v[1]:d):((v[1] > d)?v[1]:d);
		d = d * this.sqrt2:
		*/
		// why ?
		d = Math.sqrt((v[0]*v[0] + v[1]*v[1])*2);
		
		//console.log("d::"+d);
		
		var step = 1/d;
		ret = new Array(d|0);
		var count = 0;
		for(var t = 0; t < 1; t+= step) {
		   ret[count++] = {
            p2 : [
			 v[0]*t + p2d1[0],
			 v[1]*t + p2d1[1]
             ],
			z: (z2 - z1)*t + z1,
			color:color
			};
		}
		return ret;
	}
	
    
	    this.line = (p1, p2, color, rotation, translation, camera) => {
		   pr1 = Lourah.js3d.transform(p1, rotation, translation);
		   pr2 = Lourah.js3d.transform(p2, rotation, translation);
		   this.buildLine2d(
		       Lourah.js3d.project(pr1, camera, [width, height])
		     , Lourah.js3d.project(pr2, camera, [width, height])
		     , pr1[2], pr2[2]
		     , color).forEach(p => storePoint2d(p));
		}
		
		this.line2d = (w1, w2, color) => {
		   this.buildLine2d(w1.p2, w2.p2, w1.z, w2.z, color).forEach(p => storePoint2d(p));
		}
		
		
		this.polyLine = (ap, color, rotation, translation, camera) => {
			
			var aw = ap.map((p, i) => {
			     var pr = Lourah.js3d.transform(p, rotation, translation);
                 return { z: pr[2],
			      p2: Lourah.js3d.project(pr, camera, [width, height]),
                  color: color };
			      });
			
			aw.forEach((w, i) => {
				if (i === aw.length - 1) return;
				this.line2d(aw[i], aw[i+1],w.color);
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
			
			var [pr1, pr2, pr3] = [p1, p2, p3].map(p => Lourah.js3d.transform(p, rotation, translation));
			var [p2d1, p2d2, p2d3] = [pr1, pr2, pr3].map(p => Lourah.js3d.project(p, camera, [width, height]));
			var [v1, v2, v3] = [
			    this.vector(pr1, pr2),
			    this.vector(pr2, pr3),
			    this.vector(pr3, pr1)
			].sort((a, b) => this.scalarProduct(b, b) - this.scalarProduct(a, a));
			
			
			if (spot === undefined) spot = [0, 0, 1];
			var ortho = this.normalize(this.vectorialProduct(v2, v1));
			var lambda = this.scalarProduct(ortho, this.normalize(spot));
			
			lambda = lambda < 0?-lambda:lambda;
			
			
			var colorSpot = color.map((c,i) => 
				(i === 3) ? c : (((1 +3*lambda)*c)/4)|0
				);
			
			
			var [l1, l2, l3] = [
			   this.buildLine2d(p2d1, p2d2, pr1[2], pr2[2], colorSpot)
			  ,this.buildLine2d(p2d2, p2d3, pr2[2], pr3[2], colorSpot)
			  ,this.buildLine2d(p2d3, p2d1, pr3[2], pr1[2], colorSpot)
			  ].sort((a,b) => b.length - a.length);
			
			 l1.forEach((p, i) => {
				/* go from l1 to l2 follow l3 */
				if (i < l3.length) {
					this.line2d(l1[i], l3[l3.length - i -1], colorSpot);
					} else {
					this.line2d(l1[i], l2[l2.length - i - 1 + l3.length], colorSpot);
					}
				});
				
			};
			
		
		this.flush = (imageData) => {
			zP.forEach( (z, i) => {
				for(var j = 0; j<4; j++) {
						  imageData.data[i*4 + j] = z.color[j];
						}
				}
				);
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
} catch (e) {
	console.log("err::" + e + "::" + e.stack);
	}
