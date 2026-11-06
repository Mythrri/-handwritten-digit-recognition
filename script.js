let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let drawing = false;

ctx.fillStyle = 'black';
ctx.fillRect(0, 0, 280, 280);
document.getElementById('status').innerText = "Ready! Now Draw";

canvas.addEventListener('mousedown', () => drawing = true);
canvas.addEventListener('mouseup', () => drawing = false);
canvas.addEventListener('mouseleave', () => drawing = false);
canvas.addEventListener('mousemove', draw);

function draw(e) {
  if (!drawing) return;
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(e.offsetX, e.offsetY, 11, 0, Math.PI * 2);
  ctx.fill();
}

function clearCanvas() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 280, 280);
  document.getElementById('result').innerText = "Draw and click Predict";
}

// Crop + Center - same for your drawing AND template
function normalizeFromCanvas(sourceCanvas) {
  let sctx = sourceCanvas.getContext('2d');
  let w0 = sourceCanvas.width, h0 = sourceCanvas.height;
  let data = sctx.getImageData(0,0,w0,h0).data;
  let minX=w0, minY=h0, maxX=0, maxY=0, found=false;
  for(let y=0;y<h0;y++){
    for(let x=0;x<w0;x++){
      if(data[(y*w0+x)*4] > 80){
        found=true;
        if(x<minX) minX=x; if(x>maxX) maxX=x;
        if(y<minY) minY=y; if(y>maxY) maxY=y;
      }
    }
  }
  if(!found) return new Array(28*28).fill(0);
  let w = maxX-minX+1, h = maxY-minY+1;
  let out = document.createElement('canvas');
  out.width=28; out.height=28;
  let octx = out.getContext('2d');
  octx.fillStyle='black'; octx.fillRect(0,0,28,28);
  let scale = 20 / Math.max(w,h);
  octx.drawImage(sourceCanvas, minX, minY, w, h, 14-(w*scale)/2, 14-(h*scale)/2, w*scale, h*scale);
  let od = octx.getImageData(0,0,28,28).data;
  let bin = [];
  for(let i=0;i<od.length;i+=4) bin.push(od[i] > 80 ? 1 : 0);
  return bin;
}

function makeTemplate(digit, font) {
  let c = document.createElement('canvas');
  c.width=100; c.height=100;
  let x = c.getContext('2d');
  x.fillStyle='black'; x.fillRect(0,0,100,100);
  x.fillStyle='white';
  x.font = `bold 80px ${font}`;
  x.textAlign='center'; x.textBaseline='middle';
  x.fillText(digit, 50, 55);
  return normalizeFromCanvas(c);
}

function predict() {
  let input = normalizeFromCanvas(canvas);
  let fonts = ['Arial','Verdana','Times New Roman','Courier New'];
  let bestDigit = 0, bestScore = -1;
  let scores = [];

  for(let d=0; d<=9; d++){
    let bestForThisDigit = -1;
    for(let f of fonts){
      let temp = makeTemplate(d.toString(), f);
      let inter=0, union=0;
      for(let i=0;i<input.length;i++){
        if(input[i]===1 && temp[i]===1) inter++;
        if(input[i]===1 || temp[i]===1) union++;
      }
      let iou = union===0 ? 0 : inter/union;
      if(iou > bestForThisDigit) bestForThisDigit = iou;
    }
    scores.push(bestForThisDigit);
    if(bestForThisDigit > bestScore){ bestScore = bestForThisDigit; bestDigit = d; }
  }
  document.getElementById('result').innerText = "Prediction: " + bestDigit + "  (Confidence: " + Math.round(bestScore*100) + "%)";
  document.getElementById('status').innerText = "Scores: " + scores.map((s,i)=> i+":"+Math.round(s*100)+"%").join(" | ");
}