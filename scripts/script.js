/*
*   Construction by @Juanmv94 (R)2019-2020
*/

//const Diagnostics = require('Diagnostics');
const Scene = require('Scene');
const TouchGestures = require('TouchGestures');
const Textures = require('Textures');
const Materials = require('Materials');
const Audio = require('Audio');
const NativeUI = require('NativeUI');
const Patches = require('Patches');
const Reactive= require('Reactive');

const anchoPlataforma=8,altoPlataforma=8,nbloques=256,nmateriales=21,ncoloreshud=3;
const tamBloque=0.1;
const dx=-(anchoPlataforma-1)*tamBloque*0.5, dz=-(altoPlataforma-1)*tamBloque*0.5, dybloque=tamBloque*0.5;

export var audioCambiaColor,audioBoton,audioBloque,audioBorrar;
const audiosp=Promise.all([Audio.getAudioPlaybackController('cambiaColor'),Audio.getAudioPlaybackController('boton'),
		Audio.getAudioPlaybackController('block'),Audio.getAudioPlaybackController('borrar')]);

export var materiales;
const materialesp=Promise.all([...Array(nmateriales).keys()].map(i=>Materials.findFirst('material'+i)));

export var texturas;
const texturasp=Promise.all([...Array(nmateriales).keys()].map(i=>Textures.findFirst('t'+i)));
const texturagomap=Textures.findFirst('goma');

export var placer,plataformas,bloques,canvasRestantes,labelRestantes,bloquesList,bloquesCarasList,plataformasList;
const scenep=new Promise((resolve, reject) => {
	placer=Scene.root.findFirst("planeTracker0",{recursive: false}).then(pt=>{
		pt.findFirst("placer",{recursive: false}).then(pr=>{
			placer=pr;
			Promise.all([placer.findFirst("plataformas",{recursive: false}), placer.findFirst("bloques",{recursive: false}),
					placer.findFirst("restantesc",{recursive: false})]).then(pre=>{
				plataformas=pre[0]; bloques=pre[1]; canvasRestantes=pre[2];
				Promise.all([canvasRestantes.findFirst("restantes",{recursive: false}),
						Promise.all([...Array(anchoPlataforma*altoPlataforma).keys()].map(i=>plataformas.findFirst("p"+i,{recursive: false}))),
						Promise.all([...Array(nbloques).keys()].map(i=>bloques.findFirst("b"+i,{recursive: false})))]).then(r=>{
					labelRestantes=r[0]; plataformasList=r[1]; bloquesList=r[2];
					Promise.all(bloquesList.map(b=>Promise.all([...Array(6).keys()].map(i=>b.findFirst("c"+i,{recursive: false}))))).then(bc=>{
						bloquesCarasList=bc;
						resolve();
					});
				});
			});
		});
	});
});

Promise.all([audiosp,materialesp,texturasp,texturagomap,scenep]).then(prs=>{
	audioCambiaColor=prs[0][0],audioBoton=prs[0][1],audioBloque=prs[0][2],audioBorrar=prs[0][3];
	materiales=prs[1];
	texturas=prs[2];
	
	const picker = NativeUI.picker;
	const defaultIndex=1;
	var configuration = {
	  selectedIndex: defaultIndex,
	  items: [{image_texture: prs[3]}]
	};
	texturas.forEach(t=>configuration.items.push({image_texture: t}));
	
	picker.configure(configuration);
	picker.visible = true;

	picker.selectedIndex.monitor().subscribe(function(index) {cTouch(index.newValue);});

	var bloquesUsados=[];
	var bloquesNoUsados=new Array(nbloques);
	for (let i=0;i<nbloques;i++) {
		for (let j=0;j<6;j++) {
			TouchGestures.onTap(bloquesCarasList[i][j]).subscribe(function(){bTouch(i,j)});
		}
		bloquesNoUsados[i]=i;
	}

	var np=0;
	for (let i=0;i<anchoPlataforma;i++) for (let j=0;j<altoPlataforma;j++) {
		let p=plataformasList[np++];
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
	Patches.inputs.setBoolean("hideTouchInstruction",false);

	function cTouch(c) {
		if (c==0) {
			modoBorrar=true;
			if (bloquesUsados.length==0) Patches.inputs.setBoolean("hideTouchInstruction",true);
			audioBoton.play();
			
		}
		else {
			modoBorrar=false;
			if (bloquesUsados.length==0) Patches.inputs.setBoolean("hideTouchInstruction",false);
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
			Patches.inputs.setPulse("resetTracker",Reactive.once());
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
			if (bloquesUsados.length==0) Patches.inputs.setBoolean("hideTouchInstruction",true);
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
	
	//Patches
	Patches.outputs.getPulse("longPress").then(function(lp) {lp.subscribe(longPress);});
});
