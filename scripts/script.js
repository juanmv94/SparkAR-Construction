//const Diagnostics = require('Diagnostics');
const Scene = require('Scene');
const TouchGestures = require('TouchGestures');
const Textures = require('Textures');
const Materials = require('Materials');
const Audio = require('Audio');
const NativeUI = require('NativeUI');
const Patches = require('Patches');
const Reactive= require('Reactive');

const anchoPlataforma=8,altoPlataforma=8,nbloques=256,nmateriales=15,ncoloreshud=3;
const tamBloque=0.1;
const dx=-(anchoPlataforma-1)*tamBloque*0.5, dz=-(altoPlataforma-1)*tamBloque*0.5, dybloque=tamBloque*0.5;

//Audios
const audioCambiaColor=Audio.getPlaybackController('cambiaColor');
const audioBoton=Audio.getPlaybackController('boton');
const audioBloque=Audio.getPlaybackController('block');
const audioBorrar=Audio.getPlaybackController('borrar');

//Materiales
var materiales=new Array(nmateriales);
var texturas=new Array(nmateriales);
const picker = NativeUI.picker;
const defaultIndex=1;
var configuration = {
  selectedIndex: defaultIndex,
  items: [{image_texture: Textures.get('goma')}]
};
for (let i=0;i<nmateriales;i++) {
	texturas[i]=(Textures.get('t'+i));
	materiales[i]=(Materials.get('material'+i));
	configuration.items.push({image_texture: texturas[i]});
}
picker.configure(configuration);
picker.visible = true;

picker.selectedIndex.monitor().subscribe(function(index) {cTouch(index.newValue);});

//Patches
Patches.getPulseValue("longPress").subscribe(longPress);

//Elementos Escena

const placer=Scene.root.child("planeTracker0").child("placer");
const plataformas=placer.child("plataformas");
const bloques=placer.child("bloques");
const canvasRestantes=placer.child("restantesc");
const labelRestantes=canvasRestantes.child("restantes");

var bloquesUsados=[];
var bloquesNoUsados=new Array(nbloques);
var bloquesList=new Array(nbloques);
var bloquesCarasList=new Array(nbloques);
for (let i=0;i<nbloques;i++) {
	bloquesList[i]=bloques.child("b"+i);
	bloquesCarasList[i]=new Array(6);
	for (let j=0;j<6;j++) {
		bloquesCarasList[i][j]=bloquesList[i].child("c"+j);
		TouchGestures.onTap(bloquesCarasList[i][j]).subscribe(function(){bTouch(i,j)});
	}
	bloquesNoUsados[i]=i;
}

var np=0;
for (let i=0;i<anchoPlataforma;i++) for (let j=0;j<altoPlataforma;j++) {
	let p=plataformas.child("p"+np++);
	let x=dx+i*tamBloque, z=dz+j*tamBloque;
	p.transform.x=x;
	p.transform.z=z;
	TouchGestures.onTap(p).subscribe(function(){pTouch(x,z);});
}

canvasRestantes.transform.x=dx+(anchoPlataforma+1)*tamBloque;
canvasRestantes.transform.z=dz+(anchoPlataforma+1)*tamBloque;
canvasRestantes.transform.y=dybloque;


//Dinamica

var modoBorrar=false;
var color=0;

labelRestantes.text=bloquesNoUsados.length.toString();
Patches.setBooleanValue("hideTouchInstruction",false);

function cTouch(c) {
	if (c==0) {
		modoBorrar=true;
		if (bloquesUsados.length==0) Patches.setBooleanValue("hideTouchInstruction",true);
		audioBoton.play();
		
	}
	else {
		modoBorrar=false;
		if (bloquesUsados.length==0) Patches.setBooleanValue("hideTouchInstruction",false);
		color=c-1;
		audioCambiaColor.play();
	}
}

function longPress() {
	if (modoBorrar) {
		while (bloquesUsados.length>0) {
			let b=bloquesUsados.pop();
			bloquesList[b].hidden=true;
			bloquesNoUsados.push(b);
		}
		labelRestantes.text=bloquesNoUsados.length.toString();
		audioBorrar.play();
	}
	else {
		Patches.setPulseValue("resetTracker",Reactive.once());
	}
}

function pTouch(x,z) {
	if (!modoBorrar) ponerBloque(x,dybloque,z);
}

function bTouch(b,c) {
	if (modoBorrar) {
		bloquesList[b].hidden=true;
		bloquesNoUsados.push(b);
		labelRestantes.text=bloquesNoUsados.length.toString();
		audioBorrar.play();
		bloquesUsados.splice(bloquesUsados.indexOf(b),1);
	}
	else {
		switch(c) {
			case 0:
			ponerBloque(bloquesList[b].transform.x.pinLastValue(),
			bloquesList[b].transform.y.pinLastValue(),
			bloquesList[b].transform.z.pinLastValue()+tamBloque);
			break;
			case 1:
			ponerBloque(bloquesList[b].transform.x.pinLastValue()+tamBloque,
			bloquesList[b].transform.y.pinLastValue(),
			bloquesList[b].transform.z.pinLastValue());
			break;
			case 2:
			ponerBloque(bloquesList[b].transform.x.pinLastValue()-tamBloque,
			bloquesList[b].transform.y.pinLastValue(),
			bloquesList[b].transform.z.pinLastValue());
			break;
			case 3:
			ponerBloque(bloquesList[b].transform.x.pinLastValue(),
			bloquesList[b].transform.y.pinLastValue(),
			bloquesList[b].transform.z.pinLastValue()-tamBloque);
			break;
			case 4:
			ponerBloque(bloquesList[b].transform.x.pinLastValue(),
			bloquesList[b].transform.y.pinLastValue()-tamBloque,
			bloquesList[b].transform.z.pinLastValue());
			break;
			case 5:
			ponerBloque(bloquesList[b].transform.x.pinLastValue(),
			bloquesList[b].transform.y.pinLastValue()+tamBloque,
			bloquesList[b].transform.z.pinLastValue());
			break;
		}
	}
}

function ponerBloque(x,y,z) {
	if (bloquesNoUsados.length==0) {}
	else {
		if (bloquesUsados.length==0) Patches.setBooleanValue("hideTouchInstruction",true);
		let b=bloquesNoUsados.pop();
		bloquesList[b].transform.x=x;
		bloquesList[b].transform.z=z;
		bloquesList[b].transform.y=y;
		for (let i=0;i<6;i++)
			bloquesCarasList[b][i].material=materiales[color];
		bloquesList[b].hidden=false;
		labelRestantes.text=bloquesNoUsados.length.toString();
		audioBloque.play();
		bloquesUsados.push(b);
	}
}