'use strict';
function login(){
	var usr = document.querySelector('.js-usuario').value;
	if(usr!=''){
		var clave = document.querySelector('.js-clave').value;
		clave = md5(clave);
		$.ajax({
			type: "post",
			url: waooserver+"/sesiones/login",
			dataType: "json",
			data: {nickname:usr,clave:clave},
			success: function(resp) {
				if(resp.msg == "ok"){
					$("#loginimg").prop("src","images/icons/yellow/logout.png");
					$("#loginsp").html("Cerrar sesi&oacute;n");
					myApp.closeModal('.popup-login');
					var nck = $("#LoginForm input[name='nickname']").val();
					$("#LoginForm")[0].reset();
					window.localStorage.setItem("nickname",nck);
					$("#loginimg").parent().unbind('click');
					$("#loginimg").parent().bind('click',function(){logout();});
					$("#snck").html(nck);
					cambiaIconosAsesor(nck);
					contarNotificacionesSinLeer();
					tareanotificaciones = setInterval(function(){contarNotificacionesSinLeer();},60000);
					colocarAvatar('.user_avatar img');
					verificaRedirect(nck);
					actualizarToken();
				}
				else alert(resp.msg);
			},
			error: function(e) {
				alert('Error: ' + e.message);
			}
		});
	}
	else{
		alert("Escriba un nombre de usuario");
	}
}

function logout(){
	window.localStorage.removeItem("nickname");
	$("#loginimg").prop("src","images/icons/yellow/user.png");
	$("#loginsp").html("Iniciar sesi&oacute;n");
	myApp.popup(".popup-login");
	$("#loginimg").parent().bind('click',function(){myApp.popup(".popup-login");});
	clearInterval(tareanotificaciones);
	tareanotificaciones = null;
	$("#snck").html("-");
}

function register(){
	var datos = $("#RegisterForm").serialize();
	$.ajax({
		type: "post",
		url: waooserver+"/usuarios/crearUsuario",
		dataType: "json",
		data: datos,
		success: function(resp) {
			alert(resp.msg);
			$("#RegisterForm")[0].reset();
			misendbird.preInit($('.js-user-reg').val());
			location.href = 'index.html';
		},
		error: function(e) {
			alert('Error: ' + e.message);
		}
	});
}

function register2(){
	var datos = $("#RegisterForm2").serialize();
	$.ajax({
		type: "post",
		url: waooserver+"/usuarios/crearUsuario",
		dataType: "json",
		data: datos,
		success: function(resp) {
			alert(resp.msg);
			$("#RegisterForm2")[0].reset();
			misendbird.preInit($('.js-assistant-reg').val());
			location.href = 'index.html';
		},
		error: function(e) {
			alert('Error: ' + e.message);
		}
	});
}

function verificarLog(){
	var loggedin = window.localStorage.getItem("nickname");
	if(loggedin) return true;
	else return false;
}

function verificaRedirect(nickname) {
	$.ajax({
		type: "post",
		url: waooserver+"/usuarios/tipoUsuario",
		dataType: "json",
		data: {nickname:nickname},
		success: function(resp) {
			if(resp.error) alert('Error: ' + resp.error);
			else if(resp.tipo==1) {
				cargaPagina('data/crearsolicitud.html',2);
				misendbird.preInit(nickname);
			}
			else {
				cargaPagina('index.html',0);
				setTimeout(function () {
					misendbird.init(0);
					misendbird.setChannel('');
					misendbird.setAssistant(nickname);
					misendbird.obtenerDireccionCanalChat();
				},1000);
			}
		},
		error: function(e) {
			alert('Error: ' + e.message);
		}
	});
}

function verificaRedirect2(nickname) {
	if(nickname){
		$.ajax({
			type: "post",
			url: waooserver+"/usuarios/tipoUsuario",
			dataType: "json",
			data: {nickname:nickname},
			success: function(resp) {
				if(resp.error) alert('Error: ' + resp.error);
				else if(resp.tipo==1){
					$('.js-recharge').removeClass('hidden');
				}
				else{
					$('.js-recharge').addClass('hidden');
				}
			},
			error: function(e) {
				alert('Error: ' + e.message);
			}
		});
	}
}

function cambiaIconosAsesor(nickname){
	if(nickname){
		$.ajax({
			type: "post",
			url: waooserver+"/usuarios/tipoUsuario",
			dataType: "json",
			data: {nickname:nickname},
			success: function(resp) {
				if(resp.error) alert('Error: ' + resp.error);
				else{
					if(resp.tipo==2){
						$('.js-assistance-history').removeClass('hidden');
						$("#crsolspn").html("Solicitudes libres");
					}
					else if(resp.tipo==1){
						$("#crsolspn").html("Crear solicitud");
						$('.js-assistance-history').addClass('hidden');
					}
				}
			},
			error: function(e) {
				alert('Error: ' + e.message);
			}
		});
	}
	else{
		verifcarga();
	}
}

function cargarBancoSelect(id){
	$("#"+id).html('');
	$.ajax({
		type: "post",
		url: waooserver+"/bancos/listaBancos",
		dataType: "json",
		data: "",
		success: function(resp) {
			if(resp.error) $("#"+id).append("<option value='0'>"+resp.error+"</option>");
			else{
				$.each(resp.bancos,function(i,v){
					$("#"+id).append("<option value='"+v.id+"'>"+v.nombre+"</option>");
				});
			}
		},
		error: function(e) {
			alert('Error al conectar: ' + e.message);
		}
	});
}

function listaChecksMateria(id){
	$("#"+id).html('Buscando');
	$.ajax({
		type: "post",
		url: waooserver+"/materias/listarMaterias",
		dataType: "json",
		data: "",
		success: function(resp) {
			if(resp.error) $("#"+id).html("<div class='alert alert-danger'>"+resp.error+"</div>");
			else{
				$("#"+id).html("<table id='tmatsreg' class='table table-condensed'><caption><b>Materias en las que participar&aacute;s</b></caption></table>");
				var colrwn = "";
				var regs = resp.materias.length;
				var regsf = 3;
				$.each(resp.materias,function(i,v){
					if(i==0 || i%regsf==0){
						if(i>0) colrwn += "</tr>";
						colrwn += "<tr>";
					}
					colrwn += "<td><label class='label-checkbox item-content' style='display:inline;'>"
						+"<input type='checkbox' id='mat_"+i+"' name='mat_"+i+"' value='"+v.id+"'> "
						+"<div class='item-media'>"
							+"<i class='icon icon-form-checkbox'></i>"
						+"</div>"
						+"<div class='item-inner'>"
                              +"<div class='item-title'> "+v.nombre+"</div>"
						+"</div>"
					+"</label></td>";
					if(i>=(resp.materias.length-1)){
						if(regs%regsf>0){
							var fil = Math.round(regs/regsf);
							var rest = (fil*regsf) - regs;
							for(var i1=0;i1<rest;i1++){
								colrwn += "<td></td>";
							}
						}
						colrwn += "</tr>";
					}
				});
				$("#cantmatsreg").val(regs);
				$("#tmatsreg").append(colrwn);
			}
		},
		error: function(e) {
			$("#"+id).html("<div class='alert alert-danger'>Error al conectar: "+e.message+"</div>");
		}
	});
}

function contarNotificacionesSinLeer(){
	var nickname = window.localStorage.getItem("nickname");
	$.ajax({
		type: "post",
		url: waooserver+"/usuarios/notificacionesNoLeidasCant",
		dataType: "json",
		data: {nickname:nickname},
		success: function(resp) {
			if(resp.error) alert('Error: ' + resp.error);
			else{
				$("#notifcounter").html(resp.msg);
			}
		},
		error: function(e) {
			alert('Error al conectar: ' + e.message);
		}
	});
}

function listarNotificacionesSinLeer(){
	var nickname = window.localStorage.getItem("nickname");
	var iddiv = "listanotificaciones";
	$("#"+iddiv).html("");
	$.ajax({
		type: "post",
		url: waooserver+"/usuarios/notificacionesNoLeidas",
		dataType: "json",
		data: {nickname:nickname},
		success: function(resp) {
			if(resp.error) alert('Error: ' + resp.error);
			else{
				$("#"+iddiv).html("<ul class='posts'></ul>");
				if(resp.msg=="No se encontraron resultados"){
					$("#"+iddiv).html("<div class='alert alert-danger'>"+resp.msg+"</div>");
				}
				var json = JSON.parse('['+resp.msg+']');
				$.each(json,function(i2,v){
					var spl1 = (v.fecha).split(" ");
					var spl2 = spl1[0].split("-");
					$("#"+iddiv+" ul").append("<li>"
						+"<div class='post_entry' style='position:initial !important;'>"
							+"<div class='post_date' style='position:initial !important;'>"
								+"<br><span class='month'>"+spl2[0]+"-"+spl2[1]+"<span>"
								+"<span class='day'>"+spl2[2]+"<span>"
							+"</div>"
							+"<div class='post_title' style='position:initial !important;'>"
								+"<h2>"
									+((v.titulo).length>18?(v.titulo).substr(0,15)+"...":v.titulo)
								+"</h2>"
								+""+v.mensaje+"<br><br>"
								+(v.tipo==1?
									"<button class='btn btn-primary btn-block' onclick='marcarLeida("+v.id+","+v.idtrabajo+");'>Ver ofertas</button>"
									:"<button class='btn btn-primary btn-block' onclick='verModalSolicitud("+v.idtrabajo+",1);'>Ver detalles</button>")
							+"</div>"
						+"</div>"
					+"</li>");
				});
			}
		},
		error: function(e) {
			$("#"+iddiv).html("Error al conectar: "+e.message);
		}
	});
}

function marcarLeida(id,idtrabajo){
	ventanaOfertas(idtrabajo);
}

function cargarDatosUsuario(){
	var nickname = window.localStorage.getItem("nickname");
	$("#dtcnt").hide();
	cargarBancoSelect("banct");
	$("#ncks").val(nickname);
	$('#formupdate').on('submit', function(e) {
		e.preventDefault();
		modificarUsuario();
		return false;
	});
	$.ajax({
		type : 'post',
		url : waooserver+"/usuarios/datosUsuario",
		dataType: "json",
		data : {nickname:nickname},
		success : function(resp) {
			var usr = resp.usuarios;
			$.each(usr,function(i2,v){
				$("#tab1 .contactform input[name='nombre']").val(v.nombre);
				$("#tab1 .contactform input[name='apellido']").val(v.apellido);
				colocarAvatar("#profile-img");
				if(v.tipo==2){
					$("#dtcnt").show();
					$("#numct").val(v.numerocuenta);
					$("#banct").val(v.idbanco);
				}
			});
		},
		error: function(e) {
			alert("Error al conectar: "+e.message);
		}
	});
}

function cambiarClave() {
	var cl1 = $.trim($("#tab2 input[name='clave1']").val());
	var cl2 = $.trim($("#tab2 input[name='clave2']").val());
	if(cl1!="" && cl2!=""){
		if(cl1==cl2){
			var nickname = window.localStorage.getItem("nickname");
			$.ajax({
				type : 'post',
				url : waooserver+"/usuarios/actualizaClave",
				dataType: "json",
				data : {nickname:nickname,clave:cl2},
				success : function(resp) {
					alert(resp.msg);
				},
				error: function(e) {
					alert("Error al conectar: "+e.message);
				}
			});
		}
		else alert("Las claves no coinciden");
	}
	else alert("La clave no puede estar en blanco");
}

function modificarUsuario() {
	var formData = new FormData( $("#formupdate")[0] );
	$.ajax({
		type : 'post',
		url : waooserver+"/usuarios/modificarUsuario",
		dataType : "json",
		data : formData,
		async : false,
		cache : false,
		contentType : false,
		processData : false,
		success : function(resp) {
			alert(resp.msg);
			colocarAvatar("#profile-img");
		},
		error: function(e) {
			alert("Error al conectar: "+e.message);
		}
	});
}

function colocarAvatar(div) {
	var nickname = window.localStorage.getItem("nickname");
	$.ajax({
		type : 'post',
		url : waooserver+"/usuarios/verificaAvatar",
		dataType: "json",
		data : {nickname:nickname},
		success : function(resp) {
			var idimg = resp.msg;
			if(idimg*1==0) $(div).prop("src","images/default_avatar.gif");
			else $(div).prop("src",waooserver+"/usuarios/verAvatar/"+idimg+"/"+((Math.random()*1000)/1000));
		},
		error: function(e) {
			alert("Error al conectar: "+e.message);
		}
	});
}

function colocarAvatarOf(div,nickname) {
	$.ajax({
		type : 'post',
		url : waooserver+"/usuarios/verificaAvatar",
		dataType: "json",
		data : {nickname:nickname},
		success : function(resp) {
			var idimg = resp.msg;
			if(idimg*1==0) $(div).prop("src","images/default_avatar.gif");
			else $(div).prop("src",waooserver+"/usuarios/verAvatar/"+idimg+"/"+((Math.random()*1000)/1000));
		},
		error: function(e) {
			alert("Error al conectar: "+e.message);
		}
	});
}

function actualizarCuenta() {
	var idbanco = $("#banct option:selected").val();
	var numerocuenta = $.trim($("#numct").val());
	var nickname = window.localStorage.getItem("nickname");
	$.ajax({
		type : 'post',
		url : waooserver+"/usuarios/actualizarCuenta",
		dataType: "json",
		data : {nickname:nickname,numerocuenta:numerocuenta,idbanco:idbanco},
		success : function(resp) {
			alert(resp.msg);
		},
		error: function(e) {
			alert("Error al conectar: "+e.message);
		}
	});
}

function actualizarToken() {
	var token = window.localStorage.getItem("token");
	var usuario = window.localStorage.getItem("nickname");
	var plataforma = window.localStorage.getItem("plataforma");

	if(token != null) {
		$.ajax({
			type : 'post',
			url : waooserver+"/usuarios/actualizarToken",
			dataType: "json",
			data : {token: token, nickname:usuario, plataforma:plataforma},
			success : function(resp) {},
			error: function(e) {}
		});
	}
}
