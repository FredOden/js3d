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
		
    
	this.line = (p1, p2, color, rotation, translation, camera) => {
		var d = Math.max(...p1.map((p, i) => (
		   Math.abs(p2[i] - p1[i])
		   )));
		var step = 1/d;
		/*
		console.log("line::p1::" + p1);
		console.log("line::p2::" + p2);
		console.log("line:: diagonal::" + diagonal);
		console.log("line::step::" + step);
		console.log("line::d::" + d);
		*/
		var count = 0;
		for(var t = 0; t < 1; t+= step) {
			count++;
			storePoint([
			  (p2[0] - p1[0])*t + p1[0]
			, (p2[1] - p1[1])*t + p1[1]
			, (p2[2] - p1[2])*t + p1[2]
			], color, rotation, translation, camera);
			}
		  //console.log("line::count::" + count);
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
