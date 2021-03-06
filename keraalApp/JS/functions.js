﻿var dataListe = [];
var moveTags = [];				// mov list for autocompletion
var exoTags = [];				// exo list for autocompletion
var jsondataBDD = "";
var nb_tempsBDD = 0;
var activeMove = "";
var partComp = false;
var firstModeActive = true;
var init = false;
var poppyName = "poppy.local";	//nom du robot poppy ou adresse IP
var uptodate = true;
var seuilTemp = 55;				//seuil d'alerte de surchauffe moteur
var player = "";				// son lors fin d'enregistrement mouvement
var playerWarning = "";			// son lors surchauffe robot (warning avant mode securite)
var playerAlert = "";			// son lors de l'activation mode securite du robot (surchauffe)
var sendingGoRequest = 0;

function majPoppyName(){
	poppyName = $('#poppyName').val();
	console.log("poppyName : "+poppyName)
	GetIP()
	ReceiveMovelist()
}

function Compliant() {
	//var compliant= $('#compliant').val();
	var compliant= $('#compliant').prop('checked');
	if(partComp == false){  //toggle les boutons seulement si partComp=false : bouton ON/OFF ttes les parties
		partComp=true;
		if(compliant==false){
			//arrete tout (AU)
			StopExo()
			$('#compliantT').prop('checked') ? $('#compliantT').bootstrapToggle("off") : "";
			$('#compliantBG').prop('checked') ? $('#compliantBG').bootstrapToggle("off"): "";
			$('#compliantBD').prop('checked') ? $('#compliantBD').bootstrapToggle("off"): "";
			$('#compliantCol').prop('checked') ? $('#compliantCol').bootstrapToggle("off"): "";
			$('#compliantJD').prop('checked') ? $('#compliantJD').bootstrapToggle("off"): "";
			$('#compliantJG').prop('checked') ? $('#compliantJG').bootstrapToggle("off"): "";
			$.ajax({
				url: 'http://'+poppyName+':4567/?Submit=set+robot+compliant&poppyParts=',
				type:'POST',
				statusCode: {
					200: function() {
						console.log("Poppy is compliant" );
					},
					0:function(data){		//error, not connected
						console.log('error : Poppy is not connected');
						document.getElementById('poppyConnected').src="includes/images/notconnected.png";
					}
				}
			});
		} else{
			$('#compliantT').bootstrapToggle("on");
			$('#compliantJD').bootstrapToggle("on");
			$('#compliantJG').bootstrapToggle("on");
			$('#compliantCol').bootstrapToggle("on");
			$('#compliantBD').bootstrapToggle("on");
			$('#compliantBG').bootstrapToggle("on");
			$.ajax({
				url: 'http://'+poppyName+':4567/?Submit=set+robot+non-compliant&poppyParts=',
				type:'POST',
				statusCode: {
					200: function() {
						console.log("Poppy is not compliant" );
						initSound();						
					},
					0:function(data){		//error, not connected
						console.log('error : Poppy is not connected');
						document.getElementById('poppyConnected').src="includes/images/notconnected.png";
					}
				}
			});
		}
	}
	partComp=false;
}

function PartNonCompliant(poppyParts="") {
	var nbParts = 0;
	var semiPoppyParts = [];
	var nbsemiNbParts = 0;
	
	if(partComp==false){
		partComp = true;
		var poppyParts = [];
		if($('#compliantT').prop('checked')){
			poppyParts.push("tete");
			nbParts = nbParts+1;
		}
		if($('#compliantBG').prop('checked')){
			poppyParts.push("bras_gauche");
			nbParts = nbParts+1;
		}
		if($('#compliantBD').prop('checked')){
			poppyParts.push("bras_droit");
			nbParts = nbParts+1;
		}
		if($('#compliantCol').prop('checked')){
			poppyParts.push("colonne");
			nbParts = nbParts+1;
		}
		if($('#compliantJG').prop('checked')){
			poppyParts.push("jambe_gauche");
			nbParts = nbParts+1;
		}
		if($('#compliantJD').prop('checked')){
			poppyParts.push("jambe_droite");
			nbParts = nbParts+1;
		}
		
		$('input:checked[name=poppyPartsMou]').each(function(i,o){
			if($.inArray($(o).val(), poppyParts) > -1){
				semiPoppyParts.push($(o).val());
				nbsemiNbParts = nbsemiNbParts + 1;
			}
		});
        //MAJ bouton ON/OFF de Poppy entier
		if(nbParts==0){
			//partComp=false;
			$('#compliant').bootstrapToggle("off");

			$.ajax({
				url: 'http://'+poppyName+':4567/?Submit=set+robot+compliant&poppyParts=',
				type:'POST',
				statusCode: {
					200: function() {
						console.log("Poppy is compliant" );
					},
					0:function(data){		//error, not connected
						console.log('error : Poppy is not connected');
						document.getElementById('poppyConnected').src="includes/images/notconnected.png";
					}
				}
			});
		}
		else{
			$('#compliant').bootstrapToggle("on"); //MAJ de l'affichage bouton ON/OFF seulement
			$.ajax({
				url: 'http://'+poppyName+':4567/?Submit=set+robot+non-compliant&poppyParts='+poppyParts,
				type:'POST',
				statusCode: {
					200: function() {
						console.log("Poppy is not compliant" );
						$('input:checkbox[name=poppyParts]').removeAttr('checked');
						$('#modal_part_non_compliant').modal('hide');
						initSound();
					},
					0:function(data){		//error, not connected
						console.log('error : Poppy is not connected');
						document.getElementById('poppyConnected').src="includes/images/notconnected.png";
					}
				}
			});
		}

		
	}
	if(nbsemiNbParts!=0){
		semiCompliant(semiPoppyParts);
	}
}

function firstMode() {
	firstModeActive=$('#firstModeCheckBox').prop('checked');
	$.ajax({
		url: 'http://'+poppyName+':4567/?Submit=set+first+mode&first='+firstModeActive,
		type:'POST',
		statusCode: {
			201: function() {
				console.log("First mode set to "+firstModeActive);
				initSound();
			},
			0:function(data){		//error, not connected
				console.log('error : Poppy is not connected');
				document.getElementById('poppyConnected').src="includes/images/notconnected.png";
			}
		}
	});
}

function GoInitPos(pos = "undefined") {
	initSound();
	$('#exoConfig').hide();
	if(pos == "undefined"){
		var posName = prompt('Please enter the name of the initial position','debout');
		if (posName == null || posName == "") {
			alert('Erreur. Pas de nom entr\351.');
			return;
		}
	}
	else{
		var posName = pos;
	}
	$.ajax({
		url: 'http://'+poppyName+':4567/?Submit=go+init+pos&posName='+posName,
		type:'POST',
		statusCode: {
			201: function(data) {
				console.log(data);
				partComp=true;
				$('#compliantT').bootstrapToggle("on");
				$('#compliantBG').bootstrapToggle("on");
				$('#compliantBD').bootstrapToggle("on");
				$('#compliantCol').bootstrapToggle("on");
				$('#compliantJG').bootstrapToggle("on");
				$('#compliantJD').bootstrapToggle("on");
				$('#compliant').bootstrapToggle("on");
			},
			0:function(data){		//error, not connected
				console.log('error : Poppy is not connected');
				document.getElementById('poppyConnected').src="includes/images/notconnected.png";
			}
		}
	})
}

function GoDebout(){
	GoInitPos(pos="debout");
}
function GoChaise(){
	GoInitPos(pos="chaise");
}
function GoAssis(){
	GoInitPos(pos="assis");
}

function stopPlayer(playerName){
	if (playerName=="player"){
		player.pause();
	}
	if (playerName=="playerWarning"){
		playerWarning.pause();
	}
	if (playerName=="playerAlert"){
		playerAlert.pause();
	}
}

function CreateExo(type) {
	var exoConfig ;
	var listeFiles = [];
	exoConfig = '{"type":"'+type+'"';
	if(type=="exo"){
		var exoName = $('#nom_exo').val();
		var filestype = "mov";
		var nb_compt = nb_mov;
		var vide = 0;
		var pauseValue = 0;
		exoConfig = exoConfig+',"description":{';
		for (var iter = 1; iter <nb_voice+1; iter++){
			voicetime = $('#voice_time_'+iter).val();
			voicetexte = $('#voice_texte_'+iter).val();
			if(voicetime!="" && voicetime>=0){
				if(iter-vide!=1){
					exoConfig = exoConfig+',';
				}
				exoConfig = exoConfig+'"'+voicetime+'":"'+voicetexte+'"';
			}
			else{
				vide = vide+1;
			}
		}
		exoConfig = exoConfig+'}';
	}
	else if(type=="seance"){
		var exoName = $('#nom_seance').val();
		var filestype = "exo";
		var nb_compt = nb_exo;
		var pauseValue = 5;
	}
	if (exoName== "") {
		alert('Erreur. Pas de nom d\351fini.');
		return;
	}
	exoName = exoName.replace(/\350|\351|\352|\353/g,"e");	//è, é, ê, ë
	exoName = exoName.replace(/\340|\341|\342|\343|\344|\345|\346/g,"a");
	exoName = exoName.replace(/\354|\355|\356|\357/g,"i");
	exoName = exoName.replace(/\371|\372|\373|\374/g,"u");
	exoName = exoName.replace(/\360|\362|\363|\364|\365|\366/g,"o");
	exoName = exoName.replace(/\347/g,"c");	// ç
	var nb_fichiers=0;
	var vide = 0;
	for (var iter = 1; iter < nb_compt+1; iter++){
		console.log(filestype+'_'+iter);
		var namefile = $('#'+filestype+'_'+iter).val();
		if (namefile != "") {
			exoConfig = exoConfig+',"fichier'+(iter-vide)+'":{"namefile":"'+namefile+'"';
			var vitesse = $('#speed'+filestype+'_'+iter).val();
			if (!(vitesse>=1 && vitesse<=10) || vitesse == "") {
				vitesse= 5;
				//alert('warning, vitesse set to 5 (must be [1-10])');
			}
			exoConfig = exoConfig+',"vitesse":'+vitesse;
			var repet = $('#nb_repet_'+iter).val();
			if (!(repet>=1 && repet<=50) || repet == "") {
				repet= 1;
			}
			exoConfig = exoConfig+',"repetition":'+repet;
			var pause= $('#pause'+filestype+'_'+iter).val();
			if (!(pause>=0 && pause<50) || pause == "") {
				pause = pauseValue;
				//alert('warning, pause set to 5 (must be [0-49])');
			}
			exoConfig = exoConfig+',"pause":'+pause+'}';
			nb_fichiers = nb_fichiers + 1;
			listeFiles.push(namefile);
		}
		else{
			console.log(namefile)
			vide = vide +1;
		}
	}
	exoConfig = exoConfig+', "nb_fichiers":'+nb_fichiers+'}';
	if(nb_fichiers == 0){
		alert("Erreur. Aucun fichier d\351tect\351.")
		return
	}
	$.ajax({
	  url: 'http://'+poppyName+':4567/?Submit=create+exo&exoName='+exoName,
	  type:'POST',
	  data:  exoConfig,
	  statusCode: {
			201: function(data) {
				console.log(data);
				if(type=="exo"){
					nb_mov = 1;
					$('#nom_exo').val('');
					$('#modal_create_exo').modal('hide');
					tabTime = [];
					$('div.center img.barre').remove();
					$('div.center span.spanTime').remove();
					$('#add_mov').html('<tr><tr><td colspan="3"><div><label for="type_exo">mouvement 1</label></div><div class="tab_nom"><fieldset class="form-group"><input type="text" title="Nom du mouvement composant l\'exercice à créer." class="input_shadow form-control mvt_timeline" id="mov_1" placeholder="nom du mouvement" /></fieldset></div><div class="tab_vit"><fieldset class="form-group"><input type="text" title="Vitesse de lecture du mouvement, comprise entre 1 et 10. Une vitesse 5 correspond à la vitesse normale. Plus la valeur est faible et plus la vitesse sera faible" class="input_shadow form-control" id="speedmov_1" placeholder="vitesse" /></fieldset></div><div class="tab_pause"><fieldset class="form-group"><input type="text" title="Correspond à la pause après le mouvement concerné. La pause est en secondes." class="input_shadow form-control pause_timeline" id="pausemov_1" placeholder="pause" /></fieldset></div></td><!--td class="pull-right"><fieldset class="form-group"><button title="Supprimer la ligne" class="btn btn-danger supp_ligne"><span class="glyphicon glyphicon-trash" ></span></button></fieldset></td--></tr><tr><td id="add_voice_1" colspan="3"></td></tr><tr><td colspan="3"><div class="tab_voix_vide"> </div><div class="tab_voix_button"><button id="btn_mov_1" type="button" class="btn btn-info" onclick="add_one_voice(\'1\')">Voix</button></div></td></tr></tr>');
				}
				else if(type=="seance"){
					nb_exo = 1;
					$('#nom_seance').val('');
					$('#modal_create_seance').modal('hide');
					$('#add_exo').html('<tr><td colspan="3"><div><label for="type_exo">exercice 1</label></div><div class="tab_nom"><fieldset class="form-group"><select class="nom_exo_kine" id="exo_1" title="Nom de l\'exercice composant le fichier à créer."><option value="">aucun exercice</option><option value="etirementLaterauxKine">etirements Lateraux</option><option value="rotationTroncKine">rotation tronc</option><option value="cacheTeteKine">respiration</option></select></fieldset></div><div class="tab_vit" style="display:none"><fieldset class="form-group"><input type="text" title="Vitesse de lecture de l\'exercice, comprise entre 1 et 10. Une vitesse 5 correspond à la vitesse normale. Plus la valeur est faible et plus la vitesse sera faible." class="input_shadow form-control" id="speedexo_1" placeholder="vitesse" /></fieldset></div><div class="tab_repet"><fieldset class="form-group"><input type="text" title="Nombre de répétitions de l\'exercice par le sujet." class="input_shadow form-control" id="nb_repet_1" placeholder="répétitions" /></fieldset></div><div class="tab_pause"><fieldset class="form-group"><input type="text" title="Correspond à la pause après l\'exercice concerné et entre les répétitions. La pause est en secondes." class="input_shadow form-control" id="pauseexo_1" placeholder="pause" /></fieldset></div></td><!--td class="pull-right"><fieldset class="form-group"><button title="Supprimer la ligne" class="btn btn-danger supp_ligne"><span class="glyphicon glyphicon-trash" ></span></button></fieldset></td--></tr>')
				}
				$.post("./core/functions/moves.php?action=insertMov" , {"listeFiles" : listeFiles, "moveType" : type, "moveName" : exoName}).done(function(data){
					console.log(data);
				});
				insertJsonBDD(exoName);
				ReceiveMovelist();

				nb_voice = 0;
				tabTime = [];
			},
			200:function(data){
				console.log(data);
			},
			0:function(data){		//error, not connected
				console.log('error : Poppy is not connected');
				document.getElementById('poppyConnected').src="includes/images/notconnected.png";
			}
		}
	});	
}

function GoMove(rev = "False") {    //non utilisÃ© pour l'instant ! y a la fonction Go plus bas
	$('#exoConfig').hide();
	var moveName = $('#nom_mvt').val();
	var speed = $('#speed').val();
	var poppyParts = [];

	$('input:checked[name=poppyPartsGo]').each(function(i,o){
		poppyParts.push($(o).val());
	});

	if (moveName == null || moveName == "") {
		alert('Veuillez entrer un nom pour ce mouvement');
		return;
	}
	
        if (speed !=1 && speed!=2 && speed!=3 && speed!=4) {
		//alert('error, speed set to 2')
		speed = 2;
	}
	if(rev == "False"){
		var submit = "go+move";
	}
	else{
		var submit = "go+reverse";
	}
	$.ajax({
		url: 'http://'+poppyName+':4567/?Submit='+submit+'&moveName='+moveName+'&speed='+speed+'&poppyParts='+poppyParts,
		type:'POST',
		statusCode: {
			201: function(data) {
				console.log(data);
				partComp=true;
				$('#compliant').bootstrapToggle("on");
				$('input:checkbox[name=poppyPartsGo]').removeAttr('checked');
				$('#modal_go_move').modal('hide');
			},
			200:function(data){
				console.log(data);
			},
			0:function(data){		//error, not connected
				console.log('error : Poppy is not connected');
				document.getElementById('poppyConnected').src="includes/images/notconnected.png";
			}
		}
	})
}

function GoRev() {
	GoMove(rev = "True");
}

var fin_exo = 0;

function verifFinExo(){
	if(fin_exo == 1){
		$('#exoConfig').hide();   //A mettre en commentaire si on veut garder le visuel apres la seance
		$('#progressbar').progressbar('value', 100);
		$("#progressbarlabel").html("TerminÃ© !");
		//document.getElementById('Go'+activeMove).className = "play";
		activeMove = "";
		return;
	}
	var exo= document.getElementById('Go'+activeMove).className;
	$.ajax({
		url: 'http://'+poppyName+':4567/?Submit=verif+fin+exo',
		type:'POST',
		dataType : 'json',
		statusCode: {
			201: function(data) {
				$('#Go').val('start');
				
				jsondata=data.responseText.replace("u'","\"");
				while(jsondata.search("u'")!=-1){
					jsondata=jsondata.replace("u'","\"");
				}
				while(jsondata.search("'")!=-1){
					jsondata=jsondata.replace("'","\"");
				}
				
				jsondata = JSON.parse(jsondata);
				nb_repet_done=jsondata["nb_repet_done"];
				nb_repet_tot=jsondata["nb_repet_tot"];
				console.log("nombre de repetitions (réalisées/total) : "+nb_repet_done+"/"+nb_repet_tot);
				alert("nombre de repetitions (réalisées/total) : "+nb_repet_done+"/"+nb_repet_tot);
				
				fin_exo = 1
			},
			200: function(data){

				jsondata=data.responseText.replace("u'","\"");
				while(jsondata.search("u'")!=-1){
					jsondata=jsondata.replace("u'","\"");
				}
				while(jsondata.search("'")!=-1){
					jsondata=jsondata.replace("'","\"");
				}
				
				jsondata = JSON.parse(jsondata);
				
				console.log(jsondata);
				
				//On met tout en noir
				$('.exo').css('background-color','white');
				
				//On met dans une certaine couleur l'exo et le mouvement en cours
				if(jsondata["num_exo"] == 0){
					$('#mvt_'+jsondata["num_mov"]).css('background-color', 'rgba(0, 172, 193, 0.43)');
				} else{
					$('#played_exo_'+jsondata["num_exo"]).css('background-color', 'rgba(0, 172, 193, 0.43)');
					$('#played_exo_'+jsondata["num_exo"]+'_'+jsondata["num_mov"]).css('background-color', 'rgba(0, 172, 193, 0.43)');
				}
				//maj etat en pause ou non de l'exercice/seance
				if(jsondata["state"] == "pause"){
					document.getElementById('Go'+activeMove).className = "resume";
				} else if(jsondata["state"] == "playing"){
					document.getElementById('Go'+activeMove).className = "pause";
				}
				//On modifie la barre de progression
				var info = jsondata["info"].split(" ");
				var total = (info[1].split("/"))[1];
				var en_cours = (info[1].split("/"))[0];
				
				$('#progressbar').progressbar('value', en_cours/total * 100);
				$("#progressbarlabel").html(Math.round(en_cours/total*100)+" %");
			},
			0:function(data){		//error, not connected
				console.log('error : Poppy is not connected');
				document.getElementById('poppyConnected').src="includes/images/notconnected.png";
			}
		}
	});
	setTimeout("verifFinExo()", 3000);
}

var fin_mov = 0;

function verifFinMov(){
	if(fin_mov == 1){
		document.getElementById('Go'+activeMove).className = "play";
		activeMove = "";
		return;
	}
	var mov= document.getElementById('Go'+activeMove).className;
	if(mov!="resume"){
		$.ajax({
			url: 'http://'+poppyName+':4567/?Submit=verif+fin+mov',
			type:'POST',
			dataType : 'json',
			statusCode: {
				201: function(data) {
					$('#Go').val('start');
					
					fin_mov = 1;
				},
				200: function(data){
					//do nothing
				},
				0:function(data){		//error, not connected
					console.log('error : Poppy is not connected');
					document.getElementById('poppyConnected').src="includes/images/notconnected.png";
				}
			}
		});
	}
	setTimeout("verifFinMov()", 1000);
}

function GoRequest(exoName){
	$.ajax({
		url: 'http://'+poppyName+':4567/?Submit=go&exoName='+exoName,
		type:'POST',
		dataType:'json',
		statusCode: {
			202: function(data) {		//mouvement
				console.log(data.responseText);
				$('#compliant').bootstrapToggle("on");
				partComp=true;
				document.getElementById('Go'+exoName).className = "pause";
				activeMove = exoName;
				fin_mov=0;
				verifFinMov();          //A DECOMMENTER ! pour detecter fin mov. 
			},
			201: function(data) {		//exo ou seance
				jsondata=data.responseText.replace("u'","\"");
				while(jsondata.search("u'")!=-1){
					jsondata=jsondata.replace("u'","\"");
				}
				while(jsondata.search("'")!=-1){
					jsondata=jsondata.replace("'","\"");
				}
				jsondata=$.parseJSON(jsondata)
				console.log(jsondata);
				
				$('#exoConfig').show();
				$('#progressbar').progressbar('value', 0);
				$("#progressbarlabel").html("0 %");
				$("#progressbarlabel").nextAll().remove();
				
				$('#exoConfig').append('<div id="nom_seance_suivi">' + exoName + '</div>' );
				for (i=1; i<=jsondata['nb_fichiers']; i++){
					if (jsondata[i]['nb_fichiers'] >0){
						if('repetition' in jsondata[i]){
							nb_repet=jsondata[i]['repetition'];
						}
						else{
							nb_repet="1";
						}
						$('#exoConfig').append('<div class="exo nom_exo active" id="played_exo_'+i+'">' + jsondata[i]['nom']+' ('+nb_repet+')'+'</div>');
					}
					else{
						$('#exoConfig').append('<div class="exo nom_mvt" id="mvt_'+i+'">' + jsondata[i]+"</div>");
					}
				}
				
				partComp=true;
				$('#compliant').bootstrapToggle("on");
				
				document.getElementById('Go'+exoName).className = "pause";
				fin_exo=0;
				activeMove = exoName;
				verifFinExo();
			},
			200:function(data){
				console.log(data.responseText);
			},
			0:function(data){		//error, not connected
				console.log('error : Poppy is not connected');
				document.getElementById('poppyConnected').src="includes/images/notconnected.png";
			}
		}
	})
	sendingGoRequest=0;
}


function Go(exoName) {
	initSound();
	var exo= document.getElementById('Go'+exoName).className;
	if(exo=="play"){
		if(confirm('Avez-vous mis le robot sur son tabouret en position initiale "chaise" ? \n\nSi oui, cliquez sur "OK", sinon cliquez sur "Cancel" et placez-le.')==true){
			StopExo();
			if(sendingGoRequest==0){
				sendingGoRequest=1;
				setTimeout('GoRequest("'+exoName+'")', 3000);
			}
			else{
				console.log('error: already sending a go request');
			}
		}
	} 
	else if (exo=='pause'){
		$.ajax({
			url: 'http://'+poppyName+':4567/?Submit=pause+exo',
			type:'POST',
			statusCode: {
				201: function(data) {
					console.log(data);
					document.getElementById('Go'+exoName).className = "resume";	
				},
				200:function(data){
					console.log(data);
				},
				0:function(data){		//error, not connected
					console.log('error : Poppy is not connected');
					document.getElementById('poppyConnected').src="includes/images/notconnected.png";
				}
			}
		})
	}
	else if (exo=='resume'){
		$.ajax({
			url: 'http://'+poppyName+':4567/?Submit=resume+exo',
			type:'POST',
			statusCode: {
				201: function(data) {
					console.log(data);
					document.getElementById('Go'+exoName).className = "pause";	
				},
				200:function(data){
					console.log(data);
				},
				0:function(data){		//error, not connected
					console.log('error : Poppy is not connected');
					document.getElementById('poppyConnected').src="includes/images/notconnected.png";
				}
			}
		})
	}
	partComp=false;
}
	
	


function StopExo(moveName = "") {
	
	$.ajax({
		url: 'http://'+poppyName+':4567/?Submit=stop+exo',
		type:'POST',
		statusCode: {
			201: function(data) {
				console.log(data);
				fin_exo = 1;
			},
			200: function(data){
				console.log(data);
			},
			0:function(data){		//error, not connected
				console.log('error : Poppy is not connected');
				document.getElementById('poppyConnected').src="includes/images/notconnected.png";
			}
		}
	});
    $('#exoConfig').hide();
	if (moveName != ""){
		if (document.getElementById('Go'+moveName).className != "play" || activeMove != ""){ 
			document.getElementById('Go'+moveName).className = "play";
		}
	}
	if (activeMove != ""){
		document.getElementById('Go'+activeMove).className = "play";
		activeMove = "";
	}
		
}

function RemoveMove(moveName="") {
	if (moveName==""){
		var moveName = prompt('Please enter the name of the move part','move_part_name');
		if (moveName == null || moveName == "") {
			alert('Erreur. Pas de nom d\351fini.');
			return;
		}
	}
	var confirm = prompt('Are you sure you want to delete '+moveName+' ?', 'yes');
	if (confirm != 'yes'){
		return;
	}
	$.ajax({
		url: 'http://'+poppyName+':4567/?Submit=remove+move&moveName='+moveName,
		type:'POST',
		statusCode: {
			201: function(data) {
				console.log(data);
				ReceiveMovelist();
				RemoveFileDatabase(moveName);
			},
			200:function(data){
				console.log(data);
			},
			0:function(data){		//error, not connected
				console.log('error : Poppy is not connected');
				document.getElementById('poppyConnected').src="includes/images/notconnected.png";
			}
		}
	});
}

function RemoveFileDatabase(moveName="") {
	if (moveName == ""){
		var moveName = prompt('Please enter the name of the move part','move_part_name');
		if (moveName == null || moveName == "") {
			alert('Erreur. Pas de nom d\351fini.');
			return;
		}
	}
	$.post("./core/functions/moves.php?action=deleteMov", {"moveName" : moveName}).done(function(data){
		console.log(data);
		AfficheMovelist();
	});
}

function SendFile() {
	var dataToSend ;
	var namefile = prompt('Please enter the name of file','currentPos.json');
        if (namefile == null || namefile == "") {
		alert('Erreur. Pas de nom d\351fini.');
		return;
	}
	jsonfile='JS/'+namefile;
	$.getJSON(jsonfile, function(donnees) {
		dataToSend=JSON.stringify(donnees);
	}).done(function(){
		$.ajax({
			url: 'http://'+poppyName+':4567/?Submit=senddata&jsonfile='+namefile,
			type:'POST',
			data:  dataToSend,
			//dataType: 'json',
			error: function(jqXHR, textStatus, errorThrown) {
		        console.log('error : Poppy is not connected');
			    //console.log(jqXHR,textStatus, errorThrown);
				document.getElementById('poppyConnected').src="includes/images/notconnected.png";
	        }
		}).success( function(data){
			console.log(data);
		});
	});
}

function putHighlightTmp(id, value){
	var data = $(id).data('maphilight') || {};
    data.alwaysOn = value;
    $(id).data('maphilight', data).trigger('alwaysOn.maphilight');
}

function checkActiveArea(id){
	var data = $("#actif_"+id+"_warning").data('maphilight') || {};
    var data2 = $("#actif_"+id+"_stop").data('maphilight') || {};

    if (data.alwaysOn == true || data2.alwaysOn == true){
    	return true;
    } else {
    	return false;
    }

}

function ScanResults() {
	$.ajax({
		url: 'http://'+poppyName+':4567/?Submit=getMesure',
		type:'GET',
		dataType: 'json',
		statusCode: {
			200: function(data) {
				results = data
				temperatureMax = Math.max(results["temperature"]["max"])
				//console.log("temperature maximale : "+temperatureMax)
				$('#temperatureMax').html(temperatureMax+"°C");
				if (temperatureMax>=seuilTemp){
					if($('#temperatureMax').css('color')!='rgb(255, 0, 0)'){
						alert("Attention ! Poppy surchauffe !");
					} 
					$('#temperatureMax').css('color','rgb(255,0,0)');
				}
				else{
					$('#temperatureMax').css('color','rgb(255,255,223)');
				}
				var playWarning = false;
				var playAlert = false;
				for (var key in data['poppyPart_alert']){
					if (data['poppyPart_alert'][key]=='warning'){
						if ($('#compliantPart'+key).css('color') == 'rgb(255, 255, 255)'){
							playWarning = true;
						}
						$('#compliantPart'+key).css('color','rgb(255,100,30)');
						$('#compliantPart'+key).css('font-weight','bold');

						putHighlightTmp("#actif_"+key, false);
						putHighlightTmp("#actif_"+key+"_warning", true);
						putHighlightTmp("#actif_"+key+"_stop", false);
					}
					else if (data['poppyPart_alert'][key]=='stop'){
						if ($('#compliantPart'+key).css('color') != 'rgb(255, 30, 30)'){
							playAlert = true;
						}
						$('#compliantPart'+key).css('color','rgb(255,30,30)');
						$('#compliantPart'+key).css('font-weight','bold');

						putHighlightTmp("#actif_"+key, false);
						putHighlightTmp("#actif_"+key+"_warning", false);
						putHighlightTmp("#actif_"+key+"_stop", true);
					}
					else if (data['poppyPart_alert'][key]=='ok'){
						$('#compliantPart'+key).css('color','rgb(255,255,255)');
						$('#compliantPart'+key).css('font-weight','');

						$('#compliant'+key).prop('checked') ? putHighlightTmp("#actif_"+key, false) : putHighlightTmp("#actif_"+key, true) 
						
						putHighlightTmp("#actif_"+key+"_warning", false);
						putHighlightTmp("#actif_"+key+"_stop", false);
					}
				}
				if(playAlert==true){
					playerAlert.currentTime=0;
					playerAlert.play();
					setTimeout('stopPlayer("playerAlert")', 2200);
				}
				else if(playWarning==true){
					playerWarning.currentTime=0;
					playerWarning.play();
					setTimeout('stopPlayer("playerWarning")', 2200);
				}
				$('#poppyName').val(poppyName);
				if (data['compliant']=="u'True'"){
					partComp=true;
					$('#compliant').prop('checked') ? $('#compliant').bootstrapToggle("off") : "";
				}
				else{
					partComp=true;
					!$('#compliant').prop('checked') ? $('#compliant').bootstrapToggle('on') : "";
				}
				if (data['compliantT']=="u'True'"){
					partComp=true;
					$('#compliantT').prop('checked') ?$('#compliantT').bootstrapToggle("off") : "";
				}
				else{
					partComp=true;
					!$('#compliantT').prop('checked') ?$('#compliantT').bootstrapToggle('on') : "";
				}
				if (data['compliantBG']=="u'True'"){
					partComp=true;
					$('#compliantBG').prop('checked') ?$('#compliantBG').bootstrapToggle("off") : "";
				}
				else{
					partComp=true;
					!$('#compliantBG').prop('checked') ?$('#compliantBG').bootstrapToggle('on') : "";
				}
				if (data['compliantBD']=="u'True'"){
					partComp=true;
					$('#compliantBD').prop('checked') ?$('#compliantBD').bootstrapToggle("off") : "";
				}
				else{
					partComp=true;
					!$('#compliantBD').prop('checked') ?$('#compliantBD').bootstrapToggle('on') : "";
				}
				if (data['compliantCol']=="u'True'"){
					partComp=true;
					$('#compliantCol').prop('checked') ?$('#compliantCol').bootstrapToggle("off") : "";
				}
				else{
					partComp=true;
					!$('#compliantCol').prop('checked') ?$('#compliantCol').bootstrapToggle('on') : "";
				}
				if (data['compliantJD']=="u'True'"){
					partComp=true;
					$('#compliantJD').prop('checked') ?$('#compliantJD').bootstrapToggle("off") : "";
				}
				else{
					partComp=true;
					!$('#compliantJD').prop('checked') ?$('#compliantJD').bootstrapToggle('on') : "";
				}
				if (data['compliantJG']=="u'True'"){
					partComp=true;
					$('#compliantJG').prop('checked') ?$('#compliantJG').bootstrapToggle("off") : "";
				}
				else{
					partComp=true;
					!$('#compliantJG').prop('checked') ?$('#compliantJG').bootstrapToggle('on') : "";
				}
				if (data['states']['first']==false){
					$('#firstModeCheckBox').prop('checked') ? $('#firstModeCheckBox').prop("checked", false) : "";
				}
				else{
					!$('#firstModeCheckBox').prop('checked') ? $('#firstModeCheckBox').prop("checked", true) : "";
				}
				
				//semi compliant
				if (data['semiCompliantT']=="u'True'"){
					partComp=true;
					$('#semiMouT').prop("checked",true);
				}
				else{
					partComp=true;
					$('#semiMouT').prop("checked", false);
				}
				if (data['semiCompliantBG']=="u'True'"){
					partComp=true;
					$('#semiMouBG').prop("checked",true);
				}
				else{
					partComp=true;
					$('#semiMouBG').prop("checked", false);
				}
				if (data['semiCompliantBD']=="u'True'"){
					partComp=true;
					$('#semiMouBD').prop("checked",true);
				}
				else{
					partComp=true;
					$('#semiMouBD').prop("checked", false);
				}
				if (data['semiCompliantCol']=="u'True'"){
					partComp=true;
					$('#semiMouCol').prop("checked",true);
				}
				else{
					partComp=true;
					$('#semiMouCol').prop("checked", false);
				}
				if (data['semiCompliantJD']=="u'True'"){
					partComp=true;
					$('#semiMouJD').prop("checked",true);
				}
				else{
					partComp=true;
					$('#semiMouJD').prop("checked", false);
				}
				if (data['semiCompliantJG']=="u'True'"){
					partComp=true;
					$('#semiMouJG').prop("checked",true);
				}
				else{
					partComp=true;
					$('#semiMouJG').prop("checked", false);
				}
				partComp=false;
				if (uptodate==true){
					document.getElementById('poppyConnected').src="includes/images/connected.png";
				}
				else{
					document.getElementById('poppyConnected').src="includes/images/notUptodate.png";
				}
			},
			0:function(data){		//error, not connected
				//console.log('error : Poppy is not connected');
				document.getElementById('poppyConnected').src="includes/images/notconnected.png";
			}
		}
	});
	setTimeout("ScanResults()", 5000);
}

function CheckIfPoppyUptodate(nb_mov, nb_exo, nb_seance){
	$.post("./core/functions/moves.php?action=getMovesNumber").done(function(data){
		var movNumber=data[0];
		var exoNumber=data[1];
		var seanceNumber=data[2];
		if(nb_mov!=movNumber || nb_exo!=exoNumber || nb_seance!=seanceNumber){
			console.log("Poppy n'est pas a jour");
			uptodate=false;
			document.getElementById('poppyConnected').src="includes/images/notUptodate.png";
		}
		else{
			console.log("Poppy est a jour");
			uptodate=true;
		}
	});
}

function ReceiveFile(namefile = 'nothg', BDD = "false") {
	var jsondata="" ;
	if (namefile == 'nothg') {
		var namefile = prompt('Please enter the name of file','movelist');
		if (namefile === null || namefile == ''){
			alert('Erreur. Pas de nom d\351fini.');
			return;
		}
	}
	$.ajax({
		url: 'http://'+poppyName+':4567/?Submit=receivedata&jsonfile='+namefile+'&BDD='+BDD,
		type:'GET',
		dataType: 'json',
		statusCode: {
			201: function(data) {
				jsondata = data
				console.log(jsondata) 
				if (namefile == 'movelist'){
					dataListe = jsondata;		// maj variable globale
					if (data['compliant']=="u'True'"){
						partComp=true;
						$('#compliant').prop('checked') ? $('#compliant').bootstrapToggle("off") : "";
					}
					else{
						partComp=true;
						!$('#compliant').prop('checked') ? $('#compliant').bootstrapToggle('on') : "";
					}
					if (data['compliantT']=="u'True'"){
						partComp=true;
						$('#compliantT').prop('checked') ?$('#compliantT').bootstrapToggle("off") : "";
					}
					else{
						partComp=true;
						!$('#compliantT').prop('checked') ?$('#compliantT').bootstrapToggle('on') : "";
					}
					if (data['compliantBG']=="u'True'"){
						partComp=true;
						$('#compliantBG').prop('checked') ?$('#compliantBG').bootstrapToggle("off") : "";
					}
					else{
						partComp=true;
						!$('#compliantBG').prop('checked') ?$('#compliantBG').bootstrapToggle('on') : "";
					}
					if (data['compliantBD']=="u'True'"){
						partComp=true;
						$('#compliantBD').prop('checked') ?$('#compliantBD').bootstrapToggle("off") : "";
					}
					else{
						partComp=true;
						!$('#compliantBD').prop('checked') ?$('#compliantBD').bootstrapToggle('on') : "";
					}
					if (data['compliantCol']=="u'True'"){
						partComp=true;
						$('#compliantCol').prop('checked') ?$('#compliantCol').bootstrapToggle("off") : "";
					}
					else{
						partComp=true;
						!$('#compliantCol').prop('checked') ?$('#compliantCol').bootstrapToggle('on') : "";
					}
					if (data['compliantJD']=="u'True'"){
						partComp=true;
						$('#compliantJD').prop('checked') ?$('#compliantJD').bootstrapToggle("off") : "";
					}
					else{
						partComp=true;
						!$('#compliantJD').prop('checked') ?$('#compliantJD').bootstrapToggle('on') : "";
					}
					if (data['compliantJG']=="u'True'"){
						partComp=true;
						$('#compliantJG').prop('checked') ?$('#compliantJG').bootstrapToggle("off") : "";
					}
					else{
						partComp=true;
						!$('#compliantJG').prop('checked') ?$('#compliantJG').bootstrapToggle('on') : "";
					}
					//semi compliant
					if (data['semiCompliantT']=="u'True'"){
						partComp=true;
						$('#semiMouT').prop("checked",true);
					}
					else{
						partComp=true;
						$('#semiMouT').prop("checked", false);
					}
					if (data['semiCompliantBG']=="u'True'"){
						partComp=true;
						$('#semiMouBG').prop("checked",true);
					}
					else{
						partComp=true;
						$('#semiMouBG').prop("checked", false);
					}
					if (data['semiCompliantBD']=="u'True'"){
						partComp=true;
						$('#semiMouBD').prop("checked",true);
					}
					else{
						partComp=true;
						$('#semiMouBD').prop("checked", false);
					}
					if (data['semiCompliantCol']=="u'True'"){
						partComp=true;
						$('#semiMouCol').prop("checked",true);
					}
					else{
						partComp=true;
						$('#semiMouCol').prop("checked", false);
					}
					if (data['semiCompliantJD']=="u'True'"){
						partComp=true;
						$('#semiMouJD').prop("checked",true);
					}
					else{
						partComp=true;
						$('#semiMouJD').prop("checked", false);
					}
					if (data['semiCompliantJG']=="u'True'"){
						partComp=true;
						$('#semiMouJG').prop("checked",true);
					}
					else{
						partComp=true;
						$('#semiMouJG').prop("checked", false);
					}
					partComp=false;
					CheckIfPoppyUptodate(jsondata['nb_mov'], jsondata['nb_exo'],jsondata['nb_seance']);
				}
				else if (BDD == "true"){
					jsondataBDD = jsondata;
					nb_tempsBDD = jsondata["nb_temps"];
					$.post('./core/functions/moves.php?action=insertJson', {"moveName" : namefile, "jsondata" : jsondataBDD, "nb_temps" : nb_tempsBDD}).done(function(data){
						console.log(data);
						AfficheMovelist();
					});
				}
				if (uptodate==true){
					document.getElementById('poppyConnected').src="includes/images/connected.png";
				}
				else{
					document.getElementById('poppyConnected').src="includes/images/notUptodate.png";
				}
			},
			200:function(data){
				console.log("does not exist");
			},
			0:function(data){		//error, not connected
				console.log('error : Poppy is not connected');
				document.getElementById('poppyConnected').src="includes/images/notconnected.png";
			}
		}
	});
	if(init == false){
		init = true;
		setTimeout("WaitBeforeScan()", 5000);
	}
}

function insertJsonBDD(moveName){
	ReceiveFile(moveName, BDD = "true");
}

function ReceiveMovelist() {
	ReceiveFile('movelist');
}

function AfficheMovelist(playerOnly = "false"){
	var data;
	moveTags = [];
	exoTags = [];
	$.post('./core/functions/moves.php?action=getMovelist').done(function(database){
		data = JSON.parse(database);
		console.log(data);
		
		$('#stopPoppy').nextAll().remove();
		$('#tableMoves_wrapper').remove();
		$('#movelist').append('<table id="tableMoves" class="table table-striped table-bordered">'+
								'<thead>'+
									'<tr>'+
										'<th>Nom de la séance</th>'+
										'<th class="player">Player</th>'+
									'</tr>'+
								'</thead>'+
								
								'<tbody>'+
								'</tbody>'+
							'</table>');
		
		var texte = "";
		
		for (var key in data){
			moveName = data[key]["moveName"];
			if (data[key]["id_moveType"]=="1"){
				moveTags.push(moveName);
			}else if (data[key]["id_moveType"]=="2"){
				exoTags.push(moveName);
			}else if (data[key]["id_moveType"]=="3"){
				texte += "<tr>";
				texte += "<td>"+data[key]["moveName"]+" <input type='button' title='delete' onclick='RemoveMove(&quot;"+moveName+"&quot;)' id='delete'/></td>";
				texte += "<td class='player'><input type='button' title='play' onclick='Go(&quot;"+moveName+"&quot;)' id='Go"+moveName+"' class='play' style='color:#00ba00'/> <input type='button' title='stop' onclick='StopExo(&quot;"+moveName+"&quot;)' id='stop"+moveName+"' class='stop' style='color:#ea0000'/></td>";
				texte += "</tr>";
			}

			
		}

		$('#tableMoves tbody').append(texte);	
		$('#tableMoves').DataTable( {
			language: {		
				processing:     "Traitement en cours...",
				search:         "Rechercher&nbsp;:",
				lengthMenu:    "Afficher _MENU_ &eacute;l&eacute;ments",
				info:           "Affichage de l'&eacute;lement _START_ &agrave; _END_ sur _TOTAL_ &eacute;l&eacute;ments",
				infoEmpty:      "Affichage de l'&eacute;lement 0 &agrave; 0 sur 0 &eacute;l&eacute;ments",
				infoFiltered:   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
				infoPostFix:    "",
				loadingRecords: "Chargement en cours...",
				zeroRecords:    "Aucun &eacute;l&eacute;ment &agrave; afficher",
				emptyTable:     "Aucune donnÃ©e disponible dans le tableau",
				paginate: {
					first:      "Premier",
					previous:   "Pr&eacute;c&eacute;dent",
					next:       "Suivant",
					last:       "Dernier"
				},
				aria: {
					sortAscending:  ": activer pour trier la colonne par ordre croissant",
					sortDescending: ": activer pour trier la colonne par ordre dÃ©croissant"
				}
			},
			stateSave: true 	//save state of the table to load at the same state
		} );
	});
}

function stopPoppy() {
	$.ajax({
		url: 'http://'+poppyName+':4567/?Submit=stopServer',
		type:'GET'
	});
}

function GetIP() {
	$.ajax({
		url: 'http://'+poppyName+':4567/?Submit=getIP',
		type:'GET',
		dataType: 'text',
		statusCode: {
			200: function(data) {
				poppyIP = data
				console.log("adresse IP du robot : "+poppyIP)	
			},
		}
	});
}

function setRobotVolume(){
	var volume = $('#inputVolume').val();

	if (volume == null || volume == "" || volume < 0 || volume > 1) {
		console.log("error volume");
		volume=0.5
		return;
	}

	$.ajax({
		url: 'http://'+poppyName+':4567/?Submit=set+volume&volume='+volume,
		type:'POST',
		statusCode: {
			200: function(data) {
				console.log(data);
			},
			0:function(data){		//error, not connected
				console.log('error : Poppy is not connected');
				document.getElementById('poppyConnected').src="includes/images/notconnected.png";
			}
		}
	});
}

function setThresholdKinect(){
	var threshold = $('#inputKinect').val();

	if (threshold == null || threshold == "") {
		console.log("error volume");
		threshold=100;
		return;
	}

	$.ajax({
		url: 'http://'+poppyName+':4567/?Submit=set+threshold+kinect&threshold='+threshold,
		type:'POST',
		statusCode: {
			200: function(data) {
				console.log(data);
			},
			0:function(data){		//error, not connected
				console.log('error : Poppy is not connected');
				document.getElementById('poppyConnected').src="includes/images/notconnected.png";
			}
		}
	});
}

function setFaceState(){
	var faceState = $('#faceState').val();

	console.log(faceState);
	$.ajax({
		url: 'http://'+poppyName+':4567/?Submit=setFaceState',
		type:'POST',
		data:'{"data":"'+faceState+'"}',
		statusCode: {
			200: function(data) {
				console.log(data);
			},
			0:function(data){		//error, not connected
				console.log('error : Poppy is not connected');
				document.getElementById('poppyConnected').src="includes/images/notconnected.png";
			}
		}
	});
}

function setEyesDirection(){
	var eyesDirection = $('#eyesDirection').val();
	console.log(eyesDirection);
	$.ajax({
		url: 'http://'+poppyName+':4567/?Submit=setEyeDirection',
		type:'POST',
		data:'{"data":"'+eyesDirection+'"}',
		statusCode: {
			200: function(data) {
				console.log(data);
			},
			0:function(data){		//error, not connected
				console.log('error : Poppy is not connected');
				document.getElementById('poppyConnected').src="includes/images/notconnected.png";
			}
		}
	});
}

function testTTS(sentence){
	sentence = sentence.replace(/\350|\351|\352|\353/g,"e");	//è, é, ê, ë
	sentence = sentence.replace(/\340|\341|\342|\343|\344|\345|\346/g,"a");
	sentence = sentence.replace(/\354|\355|\356|\357/g,"i");
	sentence = sentence.replace(/\371|\372|\373|\374/g,"u");
	sentence = sentence.replace(/\360|\362|\363|\364|\365|\366/g,"o");
	sentence = sentence.replace(/\347/g,"c");	// ç
	$.ajax({
		url: 'http://'+poppyName+':4567/?Submit=say',
		type:'POST',
		dataType:'json',
		data:'{"data":"'+sentence+'"}',
		statusCode: {
			200: function(data) {
				console.log(data);
			},
			0:function(data){		//error, not connected
				console.log('error : Poppy is not connected');
				document.getElementById('poppyConnected').src="includes/images/notconnected.png";
			}
		}
	});
}

function WaitBeforeScan(){
	setTimeout("ScanResults()", 5000);
}

function loadSound() {
	player = document.querySelector('#audioPlayer');
	playerWarning = document.querySelector('#audioPlayerWarning');
	playerAlert = document.querySelector('#audioPlayerAlert');
}

function initSound(){
	playerWarning.play();
	playerWarning.pause();
	playerAlert.play();
	playerAlert.pause();
}

function initPage() {
	loadSound();
	$('#poppyName').val(poppyName);
	$(document).tooltip({
		classes: {
			"ui-tooltip": "highlight"
		},
		show: { delay: 300 },
		position: { my: "left bottom", at: "right top" }
	});
	StopExo();
	ReceiveMovelist();
	AfficheMovelist();
	GetIP();
}