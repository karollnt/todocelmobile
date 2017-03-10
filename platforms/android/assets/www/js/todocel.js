;
var todocel = (function () {
  var config = {
    $document: $(document),
    // backend: '//localhost/TodoCel',
    backend: 'https://todocel.herokuapp.com',
    user: window.localStorage.getItem('nickname')
  }

  var init = function () {
    todocel.navLinks.init();
    todocel.cartHandler.init();
    todocel.products.init();
    todocel.users.init();
    todocel.handlebarsHelpers.init();
    todocel.config.$document
      .on('click','.js-open-cart',todocel.cartHandler.init)
      .on('click','.js-view-order-detail',todocel.payments.orderDetail)
      .on('click','.js-facebook-share',todocel.products.shareImage)
      .on('click','.js-terms',todocel.general.closeModals)
      .on('submit','.js-login-form',todocel.users.login)
      .on('submit','.js-register-form',todocel.users.register);
  };

  return {
    config: config,
    init: init
  };
})();

todocel.general = (function () {
  var closeModals = function (ev) {
    ev.preventDefault();
    myApp.closeModal('.popup-signup');
    myApp.closeModal('.popup-signup2');
    myApp.closeModal('.popup-login');
  };

  return {
    closeModals: closeModals
  };
})();

todocel.utils = (function () {
  var fillMonthSelect = function (selector) {
    var str = '';
    for (var i = 1; i <= 12; i++) {
      str += '<option value="'+i+'">'+i+'</option>';
    }
    document.querySelector(selector).innerHTML = str;
  };

  var fillYearSelect = function (selector) {
    var fd = new Date();
    var miny = fd.getFullYear();
    var maxy = miny + 30;
    var str = '';
    for (var i = miny; i < maxy; i++) {
      str += '<option value="'+i+'">'+i+'</option>';
    }
    document.querySelector(selector).innerHTML = str;
  };

  var validateEmail = function (email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  };

  var formToJSONString = function (form) {
    var obj = {};
    var elements = form.querySelectorAll( 'input, select, textarea' );
    for( var i = 0; i < elements.length; ++i ) {
      var element = elements[i];
      var name = element.name;
      var value = element.value;
      if( name ) {
        obj[ name ] = value.trim();
      }
    }
    return JSON.stringify( obj );
  };

  var formatMoney = function(n, c, d, t){
    var c = isNaN(c = Math.abs(c)) ? 2 : c,
        d = d == undefined ? '.' : d,
        t = t == undefined ? ',' : t,
        s = n < 0 ? '-' : '',
        i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))),
        j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : '');
  };

  return {
    fillMonthSelect: fillMonthSelect,
    fillYearSelect: fillYearSelect,
    validateEmail: validateEmail,
    formToJSONString: formToJSONString,
    formatMoney: formatMoney
  };
})();

todocel.navLinks = (function () {
  var init = function () {
    $('.js-main-nav a').off('click');
    todocel.config.$document.on('click','.js-main-nav a',function (ev) {
      ev.preventDefault();
      var element = ev.currentTarget;
      loadPage(element);
    });
  };

  var loadPage = function (element) {
    var isSessionStarted = todocel.users.verifyLoggedIn();
    if (isSessionStarted) {
      var url = element.dataset.link;
      if (url) {
        mainView.router.loadPage(url+"?"+(Math.floor((Math.random() * 1000) + 1)));
        if (url.indexOf('shop') > -1) {
          todocel.products.listCategories();
        }
        if (url.indexOf('index') > -1) {
          setTimeout(function () {
            todocel.cartHandler.init();
            todocel.navLinks.init();
            todocel.users.init();
          },500);
        }
        if (url.indexOf('pasarela') > -1) {
          setTimeout(function(){
            mercpagoui.initEvents();
            todocel.utils.fillMonthSelect('.js-expirationMonth');
            todocel.utils.fillYearSelect('.js-expirationYear');
            todocel.payments.init();
          },1000);
        }
        if (url.indexOf('history') > -1) {
          setTimeout(function(){
            todocel.payments.listOrders();
          },1000);
        }
      }
    }
    else {
      myApp.popup('.popup-login');
    }
  };

  return {
    init: init
  };
})();

todocel.products = (function () {
  var init = function () {
    todocel.config.$document
    .off('click','.js-show-shop-item')
    .on('click','.js-show-shop-item',openProductDetail)
    .on('click','.js-view-category',listSubcategoriesOrProducts);
  };

  var renderCategory = function (category) {
    var html = '';
    if (category) {
      var source = $('#shopCategoriesItem').html();
      var template = Handlebars.compile(source);
      html = template(category);
    }
    return html;
  };

  var listCategories = function () {
    var ajx = $.ajax({
      url: todocel.config.backend+'/categorias/listarCategoriasPrincipales',
      type: 'post',
      dataType: 'json',
      data: ''
    });
    ajx.done(function (data) {
      var html = '', containerHtml = '';
      var $container = $('.js-shop-container');
      if (data.error) {
        containerHtml = data.error;
      }
      else {
        var categorias = data.categorias;
        var source = $('#shopCategoriesList').html();
        var template = Handlebars.compile(source);

        for (var i = 0; i < categorias.length; i++) {
          html += renderCategory(categorias[i]);
        }
        containerHtml = template({categories: html});
      }
      $container.html(containerHtml);
    });
  };

  var listSubcategoriesOrProducts = function (ev) {
    ev.preventDefault();
    var element = ev.currentTarget;
    var subCategoryId = element.dataset.sub;
    var categoryId = element.dataset.id;
    if (subCategoryId) {
      listSubcategories(categoryId);
    }
    else {
      listProductsOfCategory(categoryId);
    }
  };

  var listSubcategories = function (categoryId) {
    var ajx = $.ajax({
      url: todocel.config.backend+'/categorias/listarSubcategorias',
      type: 'post',
      dataType: 'json',
      data: {id: categoryId}
    });
    ajx.done(function (data) {
      var html = '', containerHtml = '';
      var $container = $('.js-shop-container');
      if (data.error) {
        containerHtml = data.error;
      }
      else {
        var categorias = data.subcategorias;
        var source = $('#shopCategoriesList').html();
        var template = Handlebars.compile(source);

        for (var i = 0; i < categorias.length; i++) {
          html += renderCategory(categorias[i]);
        }
        containerHtml = template({categories: html});
      }
      $container.html(containerHtml);
    });
  };

  var openProductDetail = function (ev) {
    ev.preventDefault();
    var element = ev.currentTarget;
    var url = element.href;
    mainView.router.loadPage(url+'?'+(Math.floor((Math.random() * 1000) + 1)));
    viewProductDetail(element.dataset.id);
  };

  var viewProductDetail = function (id) {
    var ajx = $.ajax({
      url: todocel.config.backend+'/productos/detallesProducto',
      type: 'post',
      dataType: 'json',
      data: {id: id}
    });
    ajx.done(function (resp) {
      var html = '';
      if (resp.error) {
        html = resp.error;
      }
      else {
        html = renderProductDetails(resp);
      }
      $('.js-product-detail').html(html);
    }).fail(function (err) {
      console.error(err);
    });
  };

  var listProductsOfCategory = function (categoryId) {
    var $container = $('.js-shop-container');

    $container.html('<img src="images/loader.gif">');
    var ajx = $.ajax({
      url: todocel.config.backend+'/productos/listarProductosPorCategoria',
      type: 'post',
      dataType: 'json',
      data: {id: categoryId}
    });
    (function (container) {
      ajx.done(function (data) {
        var html = '';
        if (data.error) {
          html = data.error;
        }
        else {
          var products = data.productos;
          if (products.length) {
            $.each(products,function (index,product) {
              html += '<li style="opacity: 1;">' + renderProduct(product) + '</li>';
            });
            html = '<ul class="shop_items js-shop-items">'+html+'</ul>';
          }
          else {
            html = 'no hay productos aun';
          }
        }
        container.html(html);
      });
    })($container);
  };

  var renderProductDetails = function (product) {
    var html = '';
    if (product) {
      var source = $('#shopProductDetails').html();
      var template = Handlebars.compile(source);
      product.descripcion = product.descripcion.replace(/(?:\r\n|\r|\n)/g, '<br/>');
      html = template(product);
    }
    return html;
  };

  var listProducts = function () {
    var ajx = $.ajax({
      url: todocel.config.backend+'/productos/listarProductos',
      type: 'post',
      dataType: 'json',
      data: {}
    });
    ajx.done(function (data) {
      var html = '';
      if (data.error) {
        html = data.error;
      }
      else {
        var products = data.productos;
        if (products.length) {
          $.each(products,function (index,product) {
            html += '<li style="opacity: 1;">' + renderProduct(product) + '</li>';
          });
          html = '<ul class="shop_items js-shop-items">'+html+'</ul>';
        }
        else {
          html = 'no hay productos aun';
        }
      }
      $('.js-shop-container').html(html);
    });
  };

  var renderProduct = function (product) {
    var html = '';
    if (product) {
      var source = $('#shopProductItem').html();
      var template = Handlebars.compile(source);
      html = template(product);
    }
    return html;
  };

  var shareImage = function (ev) {
    var imagelink = $('.js-product-image').prop('src');
    var url = 'https://www.facebook.com/sharer/sharer.php?u='+imagelink;
    $('.js-facebook-link').prop('href',url).prop('target','_blank');
  };

  return {
    init: init,
    listCategories: listCategories,
    shareImage: shareImage
  };
})();

todocel.cartHandler = (function () {
  var storage = window.localStorage;
  var cartData = {items: []};

  var init = function () {
    var data = storage.getItem('todocelCart');
    if (data) {
      cartData = JSON.parse(data);
      renderCart();
      $('.js-cart-items-counter').html(cartData.items.length);
    }
    todocel.config.$document.off('submit','.js-cart-element-form').on('submit','.js-cart-element-form',triggerSubmit);
    todocel.config.$document.on('click','.js-cart-remove-item',removeFormCart);
    todocel.config.$document.off('click','.js-addtocart').on('click','.js-addtocart',addToCart);
    todocel.config.$document.off('submit','.js-enviarPago').on('submit','.js-enviarPago',verifyCartStock);
    todocel.config.$document.off('submit','.js-pago-efectivo').on('submit','.js-pago-efectivo',verifyCartStock);
  };

  var triggerSubmit = function (ev) {
    ev.preventDefault();
    addToCart(ev);
  };

  var addToCart = function (ev) {
    ev.preventDefault();
    var elem = ev.currentTarget;
    var form = $(elem).parent().find('.js-cart-element-form')[0];
    var dataSize = cartData.items.length;
    var exists = false;
    var item = {
      id: form.querySelector('.js-cart-element-id').value * 1,
      quantity: form.querySelector('.js-cart-element-quantity').value * 1,
      number: dataSize + 1,
      name: form.querySelector('.js-cart-element-name').value,
      price: form.querySelector('.js-cart-element-price').value * 1,
      image: form.querySelector('.js-cart-element-image').value
    };
    for (var i = 0; i < dataSize; i++) {
      if (cartData.items[i].id == item.id && !exists) {
        cartData.items[i].quantity += item.quantity;
        exists = true;
      }
    }
    if (exists) saveCart();
    else addItem(item);
    alert('Producto agregado!');
  };

  var addItem = function (item) {
    cartData.items.push(item);
    saveCart();
  };

  var removeFormCart = function (ev) {
    var item;
    ev.preventDefault();
    var elem = ev.currentTarget;
    var dataSize = cartData.items.length;
    for (var i = 0; i < dataSize; i++) {
      if (cartData.items[i].id == elem.dataset.id) {
        item = cartData.items[i];
      }
    }
    if(item) removeItem(item);
  };

  var removeItem = function (item) {
    var dataSize = cartData.items.length;
    for (var i = 0; i < dataSize; i++) {
      if (cartData.items[i]) {
        if (cartData.items[i].id == item.id) {
          cartData.items.splice(i,1);
        }
      }
    }
    saveCart();
    renderCart();
  };

  var saveCart = function () {
    var strc = JSON.stringify(cartData);
    storage.setItem('todocelCart',strc);
  };

  var emptyCart = function () {
    cartData = {items: []};
    storage.removeItem('todocelCart');
  };

  var renderCartItem = function (product) {
    var html = '';
    if (product) {
      var source = $('#cartProductItem').html();
      var template = Handlebars.compile(source);
      html = template(product);
    }
    return html;
  };

  var renderCart = function () {
    var html = '', total = 0;
    var dataSize = cartData.items.length;
    for (var i = 0; i < dataSize; i++) {
      cartData.items[i].number = i + 1;
      html += renderCartItem(cartData.items[i]);
      total += cartData.items[i].price * cartData.items[i].quantity;
    }
    var vat = Math.round(total*0.0495);
    $('.js-cart-quantity').html('('+dataSize+' productos)');
    $('.js-cart-items').html(html);
    /*$('.js-cart-subtotal').html('$'+(Math.round(total*0.81)));*/
    $('.js-cart-vat').html('$'+vat);
    $('.js-cart-subtotal').html('$'+total);
    // $('.js-cart-total').html('$'+(total+vat));
    $('.js-cart-total').html('$'+(total));
    var $linkCheckout = $('.js-go-checkout');
    if (dataSize > 0) {
      $linkCheckout.show();
    }
    else {
      $linkCheckout.hide();
    }
  };

  var verifyCartStock = function (ev) {
    ev.preventDefault();
    var $btn = $('.js-send-payment');
    $btn.prop('disabled',true).html('Enviando');
    var form = ev.target;
    var jsonForm = todocel.utils.formToJSONString(form);
    jsonForm = JSON.parse(jsonForm);
    var ajx = $.ajax({
      url: todocel.config.backend+'/productos/verificarStockCart',
      type: 'post',
      dataType: 'json',
      data: {cartData: JSON.stringify(cartData)}
    });
    (function (form) {
      ajx.done(function (data) {
        var isCash = form.efectivo ? (form.efectivo*1 == 1) : false;
        if (data.responseCode == 1) {
          if (isCash) {
            form.nickname = todocel.config.user;
            todocel.cartHandler.createOrder(form);
          }
          else {
            todocel.payments.processPayment(form);
          }
        }
        else {
          alert(data.responseMessage);
          $btn.prop('disabled',false).html('<i class="fa fa-money" aria-hidden="true"></i> Aceptar');
        }
      })
      .fail(function (err) {
        console.log(err);
      });
    })(jsonForm);
  };

  var updateStock = function () {
    var dataSize = cartData.items.length;
    if (dataSize > 0) {
      var ajx = $.ajax({
        url: todocel.config.backend+'/productos/actualizarStock',
        type: 'post',
        dataType: 'json',
        data: {cartData: JSON.stringify(cartData)}
      });
      ajx.done(function (data) {
        if (data.responseCode == 1) {
          emptyCart();
          mainView.router.loadPage('success.html');
        }
        else {
          alert(data.responseMessage);
        }
        $('.js-send-payment').prop('disabled',false).html('<i class="fa fa-money" aria-hidden="true"></i> Aceptar');
      })
      .fail(function (err) {
        console.log(err);
      });
    }
  };

  var createOrder = function (jsonForm) {
    var dataSize = cartData.items.length;
    if (dataSize > 0) {
      jsonForm.detalles = cartData.items;
      var ajx = $.ajax({
        url: todocel.config.backend+'/ventas/registrarVenta',
        type: 'post',
        dataType: 'json',
        data: jsonForm
      });
      ajx.done(function (data) {
        if (data.status == 200) {
          updateStock();
        }
        else {
          alert(data.msg);
        }
      });
    }
  };

  var getTotal = function () {
    var total = 0;
    var dataSize = cartData.items.length;
    for (var i = 0; i < dataSize; i++) {
      total += cartData.items[i].price * cartData.items[i].quantity;
    }
    return total;
  };

  return {
    init: init,
    getTotal: getTotal,
    verifyCartStock: verifyCartStock,
    createOrder: createOrder
  };
})();

todocel.payments = (function () {
  var storage = window.localStorage;
  var cartData = {items: []};
  var init = function () {
    renderPrices();
  };

  var renderPrices = function () {
    var total = todocel.cartHandler.getTotal();
    var vat = Math.round(total*0.0495);
    /*$('.js-checkout-subtotal').html('$'+(Math.round(total*0.81)));*/
    $('.js-checkout-vat').html('$'+(Math.round(total*0.0495)));
    $('.js-checkout-subtotal').html('$'+total);
    $('.js-checkout-cash-value').val(total);
    $('.js-checkout-total').html('$'+(total+vat));
    $('.js-checkout-valor').val(total+vat);
  };

  var processPayment = function (form) {
    Mercadopago.createToken(document.querySelector('.js-enviarPago'), function (st,resp) {
      if(st!=200 && st!=201) {
        var reason = '';
        for (var i = 0; i < resp.cause.length; i++) {
          reason += (resp.cause[i].description)+'.';
        }
        alert(reason);
      }
      else {
        form.token = resp.id;
        form.nickname = todocel.config.user;
        todocel.cartHandler.createOrder(form);
      }
    });
  };

  var listOrders = function () {
    if (todocel.users.verifyLoggedIn()) {
      var $orderContainer = $('.js-order-container');
      $orderContainer.html('');
      var ajx = $.ajax({
        url: todocel.config.backend+'/ventas/ordenesUsuario',
        type: 'post',
        dataType: 'json',
        data: {nickname: todocel.config.user}
      });
      ajx.done(function (data) {
        var html = '';
        var orders = data.msg.orders;
        for (var i = 0; i < orders.length; i++) {
          var source = $('#orderListElement').html();
          var template = Handlebars.compile(source);
          html += template(orders[i]);
        }
        $orderContainer.html('<ul>'+html+'</ul>');
      });
    }
  };

  var orderDetail = function (ev) {
    ev.preventDefault();
    var element = ev.currentTarget;
    var orderId = element.dataset.id;
    var orderType = element.dataset.type;
    var $orderContainer = $('.js-order-container');
    $orderContainer.html('');
    var ajx = $.ajax({
      url: todocel.config.backend+'/ventas/detalleOrden',
      type: 'post',
      dataType: 'json',
      data: {id: orderId, tipo: orderType}
    });
    ajx.done(function (resp) {
      var html = '';
      var source, template, order;
      if (resp.status == 200) {
        html = '';
        order = resp.msg;
        order.permiteCargaComprobante = false;
        if ((order.estado).toLowerCase() == 'pendiente') {
          order.permiteCargaComprobante = true;
        }
        source = $('#orderDetail').html();
        template = Handlebars.compile(source);
        html = template(order);
        $orderContainer.html(html);
        todocel.config.$document.on('submit','.js-send-document',uploadVoucherFile);
      }
      else {
        alert(detail);
      }
    });

    var uploadVoucherFile = function (ev) {
      ev.preventDefault();
      var form = ev.target;
      var formData = new FormData(form);
      var ajx = $.ajax({
        type: 'post',
        url: todocel.config.backend+'/ventas/ingresarSoporte',
        dataType: 'json',
        data: formData,
        async : false,
        cache : false,
        contentType : false,
        processData : false
      });
      ajx.done(function (resp) {
        alert(resp.msg);
      })
      .fail(function (e) {
        alert('Error: ' + e.message);
      });
    };
  };

  return {
    init: init,
    processPayment: processPayment,
    listOrders: listOrders,
    orderDetail: orderDetail
  };
})();

todocel.users = (function () {
  var isLoggedIn = false;
  var init = function () {
    isLoggedIn = window.localStorage.getItem('nickname')!=null;
    var $loginElem = $('.js-login-link');
    $loginElem.off('click').on('click',function (ev) {
      ev.preventDefault();
      if (isLoggedIn) {
        logout();
      }
      else {
        myApp.popup('.popup-login');
      }
    });
    changeIcons();
  };

  var verifyLoggedIn = function () {
    return isLoggedIn;
  };

  var login = function (ev) {
    ev.preventDefault();
    var form = ev.target;
    var jsonForm = todocel.utils.formToJSONString(form);
    jsonForm = JSON.parse(jsonForm);
    if (jsonForm.nickname != '') {
      jsonForm.clave = md5(jsonForm.clave);
      var ajx = $.ajax({
        url: todocel.config.backend+'/sesiones/login',
        type: 'post',
        dataType: 'json',
        data: jsonForm
      });
      ajx.done(function (data) {
        if (data.msg == 'ok') {
          myApp.closeModal('.popup-login');
          isLoggedIn = true;
          window.localStorage.setItem('nickname',jsonForm.nickname);
          todocel.config.user = jsonForm.nickname;
          window.location.href = 'index.html';
        }
        else {
          alert(data.msg);
        }
      });
    }
  };

  var logout = function () {
    isLoggedIn = false;
    window.localStorage.removeItem('nickname');
    todocel.config.user = null;
    myApp.popup('.popup-login');
    changeIcons();
  };

  var changeIcons = function () {
    var $loginElem = $('.js-login-link');
    if (isLoggedIn) {
      $loginElem.find('img').prop('src','images/icons/yellow/logout.png');
      $loginElem.find('span').html('Logout');
    }
    else {
      myApp.popup('.popup-login');
      $loginElem.find('img').prop('src','images/icons/yellow/user.png');
      $loginElem.find('span').html('Login');
    }
  };

  var register = function (ev) {
    ev.preventDefault();
    var form = ev.target;
    var jsonForm = todocel.utils.formToJSONString(form);
    jsonForm = JSON.parse(jsonForm);
    if (jsonForm.nickname != '' && jsonForm.email != '') {
      jsonForm.clave = md5(jsonForm.clave);
      var ajx = $.ajax({
        url: todocel.config.backend+'/usuarios/crearUsuario',
        type: 'post',
        dataType: 'json',
        data: jsonForm
      });
      ajx.done(function (data) {
        alert(data.msg);
        form.reset();
        location.href = 'index.html';
      });
    }
  };

  return {
    init: init,
    verifyLoggedIn: verifyLoggedIn,
    login: login,
    register: register
  };
})();

todocel.handlebarsHelpers = (function () {
  var init = function () {
    Handlebars.registerHelper('maths', function(lvalue, operator, rvalue, options) {
      lvalue = parseFloat(lvalue);
      rvalue = parseFloat(rvalue);
      return {
        '+': lvalue + rvalue,
        '-': lvalue - rvalue,
        '*': lvalue * rvalue,
        '/': lvalue / rvalue,
        '%': lvalue % rvalue
      }[operator];
    });
  };
  return {
    init: init
  };
})();

todocel.config.$document.ready(function () {
  todocel.init();
});
