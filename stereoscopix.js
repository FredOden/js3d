 var panes = {};

cam = {
	left: [3000, 5000, 20000],
	right : [-3000, 5000, 20000]
	};

function Pane(canvas, cam, width, height) {
	canvas.width = width;
	canvas.height = height;
	//console.log("Pane::width::" + width);
	//console.log("Pane::height::" + height);
	this.ctx = canvas.getContext('2d');
	this.renderer = undefined;
	this.camera = cam;
	}

function stereoscopix(left, right) {
	//console.log("init::" + left + "," + right);
	
     height = (window.innerHeight *.7)|0;
     width = ((window.innerWidth - 40)/2)|0;
  
	
	panes = { canvas : [
	        new Pane(document.getElementById(left), cam.left, width, height)
	      , new Pane(document.getElementById(right), cam.right, width, height)
          ],
          rotation: null,
          translation: [-50, 0, 0]
          };
          
     //console.log("call display::" + JSON.stringify(panes));
     stereoscopixDisplay(0, 0, 0);
	}
	
function stereoscopixFromElements(elements) {
     	stereoscopixDisplay(...elements.map(e => document.getElementById(e).value*Math.PI/180));
}

function stereoscopixDisplay(a, b, c) {
	//console.log("in");
	panes.rotation = Lourah.js3d.rot(a, b, c);
	
	var [o, i, j, k] = [
           [0, 0, 0]
           ,[100, 0, 0]
           ,[0, 100, 0]
           ,[0, 0, 100]
          ];

         //console.log("clear");
         panes.canvas.forEach(canvas => {
         	 canvas.renderer  = new Lourah.js3d.Renderer(canvas.ctx.canvas.width, canvas.ctx.canvas.height);
              canvas.ctx.clearRect(0, 0, canvas.ctx.canvas.width, canvas.ctx.canvas.height)
              }
              );
              
              
         //console.log("axis to draw");
         [i,j,k].forEach(p => panes.canvas.forEach(canvas =>
               canvas.renderer.line(o, p,
                    [255,0,0,255],
                    null,
                    panes.translation,
                    canvas.camera)
                    )
               );
          //console.log("axis done" );
         
         panes.canvas.forEach(canvas => {
           canvas.renderer.txel(i, j, k, [0, 0, 255, 128], panes.rotation, panes.translation, canvas.camera);
           canvas.renderer.txel(o, j, k, [0, 64, 255, 128], panes.rotation, panes.translation, canvas.camera);
           canvas.renderer.txel(k, o, i, [0, 128, 255, 128], panes.rotation, panes.translation, canvas.camera);
           canvas.renderer.txel(j, i, o, [64, 0, 255, 128], panes.rotation, panes.translation, canvas.camera)
           }
           );
           
         var co = [0, 128, 0, 255]; 
         var sz = 50;
         var [a, b, c, d, e, f, g, h] = [
         [0, sz, -sz], [sz*2, sz, -sz], [sz*2, -sz, -sz], [0, -sz, -sz],
         [0, sz, sz], [sz*2, sz, sz], [sz*2, -sz, sz], [0, -sz, sz]
         ];
         
         [[a,b,c,d],[e,f,g,h], [a,e,h,d], [b,f,g,c]].forEach(s => 
            panes.canvas.forEach(canvas =>
                 canvas.renderer.polygon(s, co, panes.rotation, panes.translation, canvas.camera)
            ));
         
         sz = 25;
        [a, b, c, d, e, f, g, h] = [
         [0, sz, -sz], [sz*2, sz, -sz], [sz*2, -sz, -sz], [0, -sz, -sz],
         [0, sz, sz], [sz*2, sz, sz], [sz*2, -sz, sz], [0, -sz, sz]
         ];
         
	    [[a,b,c,d],[e,f,g,h], [a,e,h,d], [b,f,g,c]].forEach(s => 
            panes.canvas.forEach(canvas =>
                 canvas.renderer.polygon(s, co, panes.rotation, [25,25,0], canvas.camera)
            ));
	
	     panes.canvas.forEach(canvas => {
           canvas.renderer.txel(a, b, c, [120, 64, 255, 255], panes.rotation, [25, 25, 0], canvas.camera);
           canvas.renderer.txel(a, c, d, [120, 64, 255, 255], panes.rotation, [25, 25, 0], canvas.camera);
           }
           );
	
	  panes.canvas.forEach(canvas => {
	     var imageData = canvas.renderer.flush(
                canvas.ctx.getImageData(0,0,
                     canvas.ctx.canvas.width,
                     canvas.ctx.canvas.height)
                );
         canvas.ctx.putImageData(imageData,0,0);
         }
       );
       
       //console.log("done");
       
	}