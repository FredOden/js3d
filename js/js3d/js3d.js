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
     
Lourah.js3d.translate = function(p, v)  {
	return [p[0] + v[0],  p[1] + v[1], p[2] + v[2]];
	};
	
Lourah.js3d.rotate = function(m, p) {
   let p0, p1, p2;
  return m===null?p:
	[ m[0]*(p0 = p[0]) + m[1]*(p1 = p[1]) + m[2]*(p2 = p[2])
	, m[3]*p0 + m[4]*p1 + m[5]*p2
	, m[6]*p0 + m[7]*p1 + m[8]*p2];
	};
	
	Lourah.js3d.m3x3 = (m, p) => (
		[ m[0]*p[0] + m[1]*p[3] + m[2]*p[6], m[0]*p[1] + m[1]*p[4] + m[2]*p[7], m[0]*p[2] + m[1]*p[5] + m[2]*p[8]
		, m[3]*p[0] + m[4]*p[3] + m[5]*p[6], m[3]*p[1] + m[4]*p[4] + m[5]*p[7], m[3]*p[2] + m[4]*p[5] + m[5]*p[8]
		,m[6]*p[0] + m[7]*p[3] + m[8]*p[6], m[6]*p[1] + m[7]*p[4] + m[8]*p[7], m[6]*p[2] + m[7]*p[5] + m[8]*p[8] ]
	);
	
	Lourah.js3d.rot = (a, b, c) => {
		let  ca = Math.cos(a), sa = Math.sin(a)
		     , cb = Math.cos(b), sb = Math.sin(b)
		     , cc = Math.cos(c), sc = Math.sin(c)
             ;
		     //console.log([ ca, sa, cb, sb, cc, sc ]);
		return ([
	        	cb*cc, -sc*cb, sb,
	        	sa*sb*cc + ca*sc, -sa*sb*sc + ca*cc, -sa*cb,
	        	-ca*sb*cc + sa*sc, ca*sb*sc + sa*cc, ca*cb
		]);
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
	
	if (p.r === rotation && p.t === translation) return p.pr;
    p.r = rotation;
    p.t = translation;
    return p.pr = (Lourah.js3d.rotate(rotation
		                    , Lourah.js3d.translate(p, translation)));
	};
	

Lourah.js3d.Rad2Deg = 180/Math.PI;
Lourah.js3d.Deg2Rad = Math.PI/180;

Lourah.js3d.transformDeg = (p, t, a, b, c) => (
	Lourah.js3d.transform(p, t, a*Lourah.js3d.Deg2Rad, b*Lourah.js3d.Deg2Rad, c*Lourah.js3d.Deg2Rad)
	);
	
Lourah.js3d.to2d = (p, c) => ([
	((p[0]|0) - (c[0]|0))*(((c[2]|0)/((p[2]|0) + (c[2]|0)))) + (c[0]|0),
	((p[1]|0) - (c[1]|0))*(((c[2]|0)/((p[2]|0) + (c[2]|0)))) + (c[1]|0)
	]);

Lourah.js3d.toScreen = (p, dim) => [
	((dim[0] / 2)|0) + (p[0]|0),
	((dim[1] / 2)|0) - (p[1]|0)
	];


Lourah.js3d.project = (p, camera, screenDimension) => {
	  /*
	  cached projected transformed point in p.p2d
	  with attribute p.c : camera
	  */
      if(p.c === camera) return p.p2d;
      p.c = camera;
	  return p.p2d = (Lourah.js3d.toScreen(
	                              Lourah.js3d.to2d(p, camera)
	                                , screenDimension));
	};

Lourah.js3d.Renderer = function(width, height) {
	let zP = new Array(width * height);
	let diagonal = Math.sqrt(width*width + height*height);
	

	let storePoint2d = function(aw) {
		for(let i = 0; i < aw.length; i++) {
			let w = aw[i];
			if ((w[0] < 0 || w[0] > width )|| (w[1] < 0 || w[1] > height)) continue;
		    let wP = (w[0]|0) + (w[1]|0)*(width|0);
		    if (zP[wP] === undefined || zP[wP][2] <= w[2]) {
			   zP[wP] = w;
			   }
			}
		};
	
	let storePoint3d = (p, color, rotation, translation, camera) => {
		let pr = Lourah.js3d.transform(p, rotation, translation);
		let p2 = Lourah.js3d.project(pr, camera, [width, height]);
		storePoint2d([[
			p2[0], p2[1],
			pr[2],
			color
			]]);
		};
	
	this.shape = (ap, color, rotation, translation, camera) => {
		ap.forEach(p => storePoint3d(p, color, rotation, translation, camera));
		};
		
		
	this.sqrt2 = Math.sqrt(2);
	
	this.buildLine2d = (p2d1, p2d2, z1, z2, color) => {
		
		let b0 = p2d1[0]
		    , b1 = p2d1[1]
		    ;
		
		let v0 = p2d2[0] - b0
           ,  v1 = p2d2[1] - b1
           ;
		let vz = z2 - z1;
		
		// find a quick solution to determine
		// nb of dots on a line ...
		// @Check
		
		//d = Math.sqrt((v[0]*v[0] + v[1]*v[1])*2);
		
		// still Mahattan is the best solution !
		// + 2 for each end points
        let d = (2 + (v0 < 0?-v0:v0) + (v1 < 0?-v1:v1))|0;
		let step = 1/d;
		ret = new Array(d|0);
		v0 *= step;
		v1 *= step;
		vz *= step;
		for(let count = 0|0; count < ret.length|0; count++) {
		   ret[count] = [
			 v0*count + b0,
			 v1*count + b1,
			 vz*count + z1,
			color
			];
		}
		return ret;
	}
	
    
	    this.line = (p1, p2, color, rotation, translation, camera) => {
		   let pr1 = Lourah.js3d.transform(p1, rotation, translation);
		   let pr2 = Lourah.js3d.transform(p2, rotation, translation);
		   storePoint2d(this.buildLine2d(
		       Lourah.js3d.project(pr1, camera, [width, height])
		     , Lourah.js3d.project(pr2, camera, [width, height])
		     , pr1[2], pr2[2]
		     , color));
		}
		
		this.line2d = (w1, w2, color) => {
		   storePoint2d(this.buildLine2d(w1, w2, w1[2], w2[2], color));
		}
		
		
		this.polyLine = (ap, color, rotation, translation, camera) => {
			
			let aw = ap.map((p, i) => {
			     let pr = Lourah.js3d.transform(p, rotation, translation);
			     let p2 = Lourah.js3d.project(pr, camera, [width, height]);
			     return [ p2[0], p2[1], pr[2], color ];
                 });
			
			aw.forEach((w, i) => {
				if (i === aw.length - 1) return;
				this.line2d(aw[i], aw[i+1],w[3]);
				});
				
			};
			
		this.polygon =  (ap, color, rotation, translation, camera) => {
			this.polyLine([...ap, ap[0]], color, rotation, translation, camera);
			};
		
		this.vector = (p1, p2) => ([
		p2[0] - p1[0],
		p2[1] - p1[1],
		p2[2] - p1[2]
		]);
		
		
		this.vectorialProduct = (v1, v2) => [
		v1[1]*v2[2] - v1[2]*v2[1],
		v1[2]*v2[0] - v1[0]*v2[2],
		v1[0]*v2[1] - v1[1]*v2[0]
		];
		
		this.scalarProduct = (v1, v2) => (
		   v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2]
		);
		
		// to quickly compare vector size without
		// using scalarproduct or norm
		this.manhattan = (v) => (
		   (v[0]<0?-v[0]:v[0])
		+ (v[1]<0?-v[1]:v[1])
		+ (v[2]<0?-v[2]:v[2])
		);
		
		this.norm = v => Math.sqrt(this.scalarProduct(v, v));
		
		
		this.normalize = v => {
			let norm = 1/this.norm(v);
			return [ v[0]*norm, v[1]*norm, v[2]*norm ];
			}
		
		
		this.txel = (p1, p2, p3, color, rotation, translation, camera, spot) => {
			
            let pr1 = Lourah.js3d.transform(p1, rotation, translation)
               , pr2 = Lourah.js3d.transform(p2, rotation, translation)
               , pr3 = Lourah.js3d.transform(p3, rotation, translation)
               ;
			   
			
			let p2d1 = Lourah.js3d.project(pr1, camera, [width, height])
                , p2d2 = Lourah.js3d.project(pr2, camera, [width, height])
                , p2d3 = Lourah.js3d.project(pr3, camera, [width, height])
              ;
              
			
			let v1, v2, v3;
			let va = this.vector(pr1, pr2)
			    , vb = this.vector(pr2, pr3)
			    , vc = this.vector(pr3, pr1)
			    ;
			
			let vam = this.manhattan(va)|0
			   , vbm = this.manhattan(vb)|0
			   , vcm = this.manhattan(vc)|0
			   ;
			
			
			if (vam >= vbm && vam >= vcm) {
				v1 = va;
				if (vbm > vcm) { v2 = vb; v3 = vc; }
				else { v2 = vc ; v3 = vb; }
			 }
			else if (vbm >= vcm && vbm >= vam) {
			    v1 = vb;
			    if (vcm > vam) { v2 = vc; v3 = va; }
			    else {v2 = va; v3 = vc; };
			  }
			  else if (vcm >= vam && vcm >= vbm) {
			     v1 = vc;
				 if (vam > vbm) { v2 = va; v3= vb; }
			     else { v2 = vb; v3 = va; };
			  };
			 
			// is quicker than:
            //.sort((a, b) => this.scalarProduct(b, b) - this.scalarProduct(a, a));
			
			
			if (spot === undefined) spot = [0, 0, 1];
			// caching spot vector normalization
			if (spot.n === undefined) spot.n = this.normalize(spot);
			
			
			let ortho = this.normalize(this.vectorialProduct(v2, v1));
			let lambda = this.scalarProduct(ortho, spot.n);
			
			
			lambda = (.25 + .75*(lambda < 0?-lambda:lambda));
			
			let colorSpot = [
			    (lambda*(color[0]|0))|0,
			    (lambda*(color[1]|0))|0,
			    (lambda*(color[2]|0))|0,
			    color[3]|0
			];
			
			
			let la = this.buildLine2d(p2d1, p2d2, pr1[2], pr2[2])
			  ,lb = this.buildLine2d(p2d2, p2d3, pr2[2], pr3[2])
			  ,lc = this.buildLine2d(p2d3, p2d1, pr3[2], pr1[2])
			  ;
			
			let lal = la.length|0
			   , lbl = lb.length|0
			   , lcl = lc.length|0
			   ;
			
			let l1, l2, l3;
			if (lal >= lbl && lal >= lcl) {
				l1 = la;
				if (lbl > lcl) { l2 = lb; l3 = lc }
				else { l2 = lc; l3 = lb }
				}
			else if (lbl >= lcl && lbl >= lal) {
				l1 = lb;
				if (lcl > lal) { l2 = lc; l3 = la }
				else { l2 = la; l3 = lc }
				}
			else if (lcl >= lal && lcl >= lbl) {
				l1 = lc;
				if (lal > lbl) { l2 = la; l3 = lb }
				else { l2 = lb; l3 = la }
				}
			
			let ll2 = l2.length
			    , ll3 = l3.length
			    , ll3m1 = l3.length - 1
			    , ll2mll3m1 = l2.length + l3.length - 1
			    ;
			
			 for(let i = 0; i < l1.length; i++) {
				/* go from l1 to l2 follow l3 */
				if (i < ll3) {
					this.line2d(l1[i], l3[ll3m1 - i], colorSpot);
					} else {
					this.line2d(l1[i], l2[ll2mll3m1 - i], colorSpot);
					}
				}
			};
			
		
		this.flush = (imageData) => {
			for(let i = 0; i < zP.length; i++) {
				if (zP[i] === undefined) continue;
				let zp;
				let i4 = i*4;
		        imageData.data[i4++] = (zp=zP[i][3])[0];
		        imageData.data[i4++] = zp[1];
		        imageData.data[i4++] = zp[2];
				imageData.data[i4++] = zp[3];
				}
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
