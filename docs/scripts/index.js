(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof exports !== "undefined") {
    factory();
  } else {
    var mod = {
      exports: {}
    };
    factory();
    global.index = mod.exports;
  }
})(this, function () {
  "use strict";

  (function () {
    var app = {
      menuPopup: null,
      // 菜单选项 遮罩层 element
      navPopupMenu: null,
      // 菜单选项
      navMenu: null // 菜单选项列表

    }; // 节流

    function debonuce(fun) {
      var interval = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 60;
      var now = 0;
      return function () {
        if (Date.now() - now > interval) {
          // 执行 并更新执行时间
          now = Date.now();
          return fun.apply(this, arguments);
        }
      };
    } // 贝塞尔曲线计算


    function easeInOutCubic(t, b, c, d) {
      var cc = c - b;
      t /= d / 2;

      if (t < 1) {
        return cc / 2 * t * t * t + b;
      } else {
        return cc / 2 * ((t -= 2) * t * t + 2) + b;
      }
    } // shim layer with setTimeout fallback


    window.requestAnimFrame = function () {
      return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
        window.setTimeout(callback, 1000 / 60);
      };
    }(); // 文章查看


    window.addEventListener("hashchange", function () {
      var archive = window.location.hash.split("#/archive")[1];

      if (archive) {
        fetch("./archives/".concat(archive, ".html")).then(function (response) {
          var contentType = response.headers.get("content-type");
          console.log(response, contentType);

          if (contentType.includes("text/html")) {
            return response.text();
          } // return response.json();

        }).then(function (myJson) {
          document.getElementById("posts").innerHTML = myJson;
        });
      }
    }); // 滚动时侧边栏位置

    window.addEventListener("scroll", function () {
      debonuce(handleScroll)();
    });

    function handleScroll() {
      if (!app.mainHeight) {
        var contentHeight = document.getElementById("content").clientHeight;
        var mainHeight = document.getElementById("main").clientHeight;
        app.mainHeight = mainHeight > contentHeight ? mainHeight : contentHeight;
      }

      var mainHeight = app.mainHeight; // console.log('handle', Math.abs(document.body.getBoundingClientRect().top), mainHeight -document.body.clientHeight);

      var scrollPercent = app.scrollPercent || document.getElementById("scroll-percent");
      var percent = Math.floor(Math.abs(document.body.getBoundingClientRect().top) / (mainHeight - document.body.clientHeight) * 100);
      scrollPercent.textContent = percent + "%"; // aside 吸顶部

      var ele = app.aside || document.getElementById("sidebar");

      if (ele) {
        var offsetTop = ele.getBoundingClientRect().top;

        if (offsetTop < 20) {
          ele.children[0].classList.add("affix");
        } else {
          ele.children[0].classList.remove("affix");
        }
      }
    } // 添加UI-element 事件
    // 显示菜单


    document.getElementById("site-nav-toggle").addEventListener("click", function () {
      app.toggleMenuPopup();
    }); // 遮罩层点击隐藏

    document.getElementById("nav-popup").addEventListener("click", function () {
      app.toggleMenuPopup();
    });

    app.toggleMenuPopup = function () {
      if (!app.menuPopup) {
        // 未缓存
        app.menuPopup = document.getElementById("nav-popup");
        app.navPopupMenu = document.getElementById("nav-popup-menu");
        app.navMenu = document.getElementById("menu");
      }

      var classList = app.menuPopup.classList;

      if (classList.contains("nav-popup--visible")) {
        // 显示 => 隐藏
        document.body.style.overflow = "auto";
        classList.remove("nav-popup--visible");
        app.navPopupMenu.classList.remove("nav-popup-menu-show");
      } else {
        // 隐藏 => 显示
        document.body.style.overflow = "hidden";
        classList.add("nav-popup--visible");
        app.navPopupMenu.classList.add("nav-popup-menu-show");

        if (!app.navPopupMenu.hasChildNodes()) {
          app.navPopupMenu.appendChild(app.navMenu.cloneNode(true));
        }
      }
    }; // 回到顶部


    document.getElementById("back-to-top").addEventListener("click", function () {
      console.log("scroll start"); // window.scrollTo(0);

      var scrollTop = window.pageYOffset;
      var startTime = Date.now();

      function frameFunc() {
        var timestamp = Date.now();
        var time = timestamp - startTime;
        var xPos = easeInOutCubic(time, scrollTop, 0, 300); // console.log(window.pageYOffset, xPos);

        window.scrollTo(0, xPos);

        if (time < 300) {
          window.requestAnimFrame(frameFunc);
        } else {
          window.scrollTo(0, 0);
        }
      }

      window.requestAnimFrame(frameFunc);
    }); // TODO add service worker code here

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js').then(function () {
        console.log('Service Worker Registered');
      });
    }
  })();
});