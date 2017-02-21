'use strict';
// https://www.mercadopago.com.co/developers/es/solutions/payments/custom-checkout/charge-with-creditcard/javascript/
// https://www.mercadopago.com.co/developers/es/tools/sdk/client/javascript/
var mercpago = (function(){
  var paymentMethods;
  var idTypes;
  var infoNeeded;
  var init = function(){
    $.ajax({
      type : 'post',
      url : todocel.config.backend+"/solicitudes/datosPasarela",
      dataType: "json",
      data : "",
      success : function(resp){
        Mercadopago.setPublishableKey(resp.pubKey);
        searchPaymentMethods();
        searchIdTypes();
      },
      error: function(e){
        alert(e.message);
      }
    });
  };
  var getPaymentMethods = function(){
    return paymentMethods;
  };
  var getIdTypes = function(){
    return idTypes;
  };
  var getInfoNeeded = function(){
    return infoNeeded;
  };
  var searchPaymentMethods = function(){
    Mercadopago.getAllPaymentMethods(function(st,resp){
      paymentMethods = resp;
    });
  };
  var searchIdTypes = function(){
    Mercadopago.getIdentificationTypes(function(st,resp){
      idTypes = resp;
    });
  };
  var searchInfoNeeded = function(methodId){
    Mercadopago.getPaymentMethod({'payment_method_id':methodId},function (st,resp) {
      infoNeeded = resp.additional_info_needed;
    });
  };
  return{
    init: init,
    getIdTypes: getIdTypes,
    getPaymentMethods: getPaymentMethods,
    getInfoNeeded: getInfoNeeded
  };
})();

//init mercpago
mercpago.init();

var mercpagoui = (function(){
  var typeTransl = {
    'ticket':'Factura impresa','atm':'Cajero electronico',
    'credit_card':'Tarjeta credito','debit_card':'Tarjeta debito','prepaid_card':'Tarjeta prepagada',
    'cardholder_name':'Nombre','cardholder_identification_type':'Tipo de identificacion','cardholder_identification_number':'Numero de identificacion'
  };
  var selectTipoId = function(){
    var idTypes = mercpago.getIdTypes();
    var html = "<select id='docType' name='docType' data-checkout='docType' class='js-tipoId form_select'>";
    $.each(idTypes,function (ixd,obj) {
      html += "<option value='"+obj.id+"'>"+obj.name+"</option>";
    });
    html += "</select>";
    return html;
  };
  var selectTipoPago = function(){
    var paymentMethods = mercpago.getPaymentMethods();
    var html = "<select class='js-miTipoPago form_select' name='paymentMethodId'>";
    $.each(paymentMethods,function(ixd,obj){
      if(obj.status=='active' && obj.payment_type_id=='credit_card'){
        html +=
          "<option style='background-image:url("+obj.secure_thumbnail+");' value='"+obj.id+"' data-type='"+obj.payment_type_id+"' class='miopt'>"
            +obj.name
          +" ("+(typeTransl[obj.payment_type_id])+")</option>";
      }
    });
    html += "</select>";
    return html;
  };
  var getBin = function(){
    var bin = '';
    var ccNumber = $.trim($('.js-cardNumber').val());
    if(ccNumber!='') bin = ccNumber.replace(/[ .-]/g, '').slice(0, 6);
    return bin;
  };
  var adivinarTipoTarjeta = function(){
    var bin = getBin();
    if(bin.length>5) Mercadopago.getPaymentMethod({"bin": bin}, function (st,resp) {
      if(st==200) $('.js-miTipoPago').val(resp[0].id);
    });
  };
  var cuotasParaTarjeta = function(){
    var bin = getBin();
    var $sel = $('.js-cuotas');
    var $sel2 = $('.js-issuer');
    if(bin.length>5){
      $sel.html('');
      Mercadopago.getInstallments({"bin": bin,"amount": $('.js-valorOferta').val()}, function(st,resp){
        var payerCosts = resp[0].payer_costs;
        for (var i = 0; i < payerCosts.length; i++) {
          $sel.append("<option value='"+payerCosts[i].installments+"'>"+(payerCosts[i].recommended_message || payerCosts[i].installments)+"</option>");
        }
      });
      $sel2.html('');
      Mercadopago.getIssuers($('.js-miTipoPago').val(),function (st,resp) {
        var isus = resp[0];
        $.each(isus,function (i,obj) {
          $sel2.append("<option style='background-image:url("+obj.secure_thumbnail+");' value='"+obj.id+"' class='miopt'>"+obj.name+"</option>");
        });
      });
    }
  };
  var enviarPago = function(){
    var $datos = document.querySelector('.js-enviarPago');
    Mercadopago.createToken($datos,function (st,resp) {
      if(st!=200 && st!=201){
        alert('No es posible llevar a cabo el proceso');
        $('.js-enviaPago').button('reset');
      }
      else {
        $('.js-token').val(resp.id);
        guardaPago();
      }
    });
  };
  var guardaPago = function(){
    $('.js-nick').val(window.localStorage.getItem("nickname"));
    $.ajax({
      type : 'post',
      url : todocel.config.backend+"/usuarios/recargarTokensMP",
      dataType: "json",
      data : $('.js-enviarPago').serialize(),
      success : function(resp) {
        if(resp.error){
          alert(resp.error);
          $('.js-enviaPago').button('reset');
        }
        else{
          alert(resp.msg);
          cargaPagina('index.html');
        }
      },
      error: function(e) {
        alert(e.message);
        $('.js-enviaPago').button('reset');
      }
    });
  };
  var initEvents = function(){
    var s1 = selectTipoId();
    var s2 = selectTipoPago();
    $('.js-tipoId-td').html(s1);
    $('.js-tipoPago').html(s2);
    $('.js-cardNumber').off('keyup paste').on('keyup paste',function(){
      clearTimeout($(this).data('timeout'));
      $(this).data('timeout', setTimeout(function(){
        adivinarTipoTarjeta();
      },200));
    });
    /*$('.js-enviaPago').off('click').on('click',function(){
      $(this).button('loading');
      enviarPago();
    });*/
  };
  return{
    selectTipoId: selectTipoId,
    selectTipoPago: selectTipoPago,
    adivinarTipoTarjeta: adivinarTipoTarjeta,
    enviarPago: enviarPago,
    initEvents: initEvents
  };
})();
