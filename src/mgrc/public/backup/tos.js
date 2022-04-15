const {a,br,button,circle,div,form,h1,i,iframe,img,input,link,meta,object,option,path,pre,script,select,span,svg,textarea} = H

if(typeof button == 'undefined') alert('This browser is not supported. Please upgrade. Thank you')

// Check whether running on mobile
var isMobile = function() { return /mobile/i.test(navigator.userAgent) },
  icons = {
    close: '<svg viewBox="0 0 512 512"><circle style="fill: white; visibility: hidden;" cx="256" cy="256" r="246"></circle><path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm121.6 313.1c4.7 4.7 4.7 12.3 0 17L338 377.6c-4.7 4.7-12.3 4.7-17 0L256 312l-65.1 65.6c-4.7 4.7-12.3 4.7-17 0L134.4 338c-4.7-4.7-4.7-12.3 0-17l65.6-65-65.6-65.1c-4.7-4.7-4.7-12.3 0-17l39.6-39.6c4.7-4.7 12.3-4.7 17 0l65 65.7 65.1-65.6c4.7-4.7 12.3-4.7 17 0l39.6 39.6c4.7 4.7 4.7 12.3 0 17L312 256l65.6 65.1z"></path></svg>',
    hamburger: '<svg viewBox="0 0 448 512"><path d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z"></path></svg>',
    home: '<svg viewBox="0 0 576 512"><path d="M280.37 148.26L96 300.11V464a16 16 0 0 0 16 16l112.06-.29a16 16 0 0 0 15.92-16V368a16 16 0 0 1 16-16h64a16 16 0 0 1 16 16v95.64a16 16 0 0 0 16 16.05L464 480a16 16 0 0 0 16-16V300L295.67 148.26a12.19 12.19 0 0 0-15.3 0zM571.6 251.47L488 182.56V44.05a12 12 0 0 0-12-12h-56a12 12 0 0 0-12 12v72.61L318.47 43a48 48 0 0 0-61 0L4.34 251.47a12 12 0 0 0-1.6 16.9l25.5 31A12 12 0 0 0 45.15 301l235.22-193.74a12.19 12.19 0 0 1 15.3 0L530.9 301a12 12 0 0 0 16.9-1.6l25.5-31a12 12 0 0 0-1.7-16.93z"></path></svg>',
    phone: '<svg viewBox="0 0 320 512" class="svg-inline--fa fa-mobile-alt fa-w-10"><path d="M272 0H48C21.5 0 0 21.5 0 48v416c0 26.5 21.5 48 48 48h224c26.5 0 48-21.5 48-48V48c0-26.5-21.5-48-48-48zM160 480c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm112-108c0 6.6-5.4 12-12 12H60c-6.6 0-12-5.4-12-12V60c0-6.6 5.4-12 12-12h200c6.6 0 12 5.4 12 12v312z"></path></svg>',
    star: '<svg viewBox="0 0 576 512"><path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"></path></svg>',
    user: '<svg viewBox="0 0 448 512"><path d="M313.6 304c-28.7 0-42.5 16-89.6 16-47.1 0-60.8-16-89.6-16C60.2 304 0 364.2 0 438.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-25.6c0-74.2-60.2-134.4-134.4-134.4zM400 464H48v-25.6c0-47.6 38.8-86.4 86.4-86.4 14.6 0 38.3 16 89.6 16 51.7 0 74.9-16 89.6-16 47.6 0 86.4 38.8 86.4 86.4V464zM224 288c79.5 0 144-64.5 144-144S303.5 0 224 0 80 64.5 80 144s64.5 144 144 144zm0-240c52.9 0 96 43.1 96 96s-43.1 96-96 96-96-43.1-96-96 43.1-96 96-96z"></path></svg>'
  }, ws, rs = {}, lastHash, today = new Date()

/* Utilities */

// Returns the tag attributes needed to link an input to a state property
function bind(obj, name, attribs = {}) {
  obj[name] = obj[name] || ''
  attribs.onkeydown = function(e, el) {
    el = (typeof el == 'undefined') ? e.currentTarget : el
    setTimeout(function() {obj[name] = el.value || ''})
  }
  //attribs.value = obj[name]
  return attribs
}

/* TarnOS */

var TarnOS = (function () {

  function App(p, s) {
    var route = TarnOS.getRoute(0),
      name = 'Alt Republic',
      title = route != 'Home' ? (name + ' - ' + route) : name

    document.title = title

    return div.TarnOS[s.menu ? 'menu' : ''][isMobile() ? 'is-mobile' : 'not-mobile']({},
      div.Top.Nav({}, a.LogoLink({href: '/#Home'}, span.Logo({
          innerHTML: icons.star,
          title: 'Alt Republic'
        }), span.Title({}, 'Alt Republic')),
        a.Menu_Button({onclick: function(e) {
          s.menu = s.menu ? false : true
        }, innerHTML: icons.hamburger, className: s.menu ? 'menu-show' : ''})
      ),
      //div.Route[route]({}, H(TarnOS.Ad), H(Load(route)), H(TarnOS.Ad)),
      div.Route[route]({}, H(Load(route))),
      H(Nav)
    )
  }

  function Layout(p, s) {
    return H(TarnOS.App)
  }

  function Loader(p, s) {
    s.routes = s.routes ? s.routes : ['Home']
    var hd = function(route) {
      if(!window[route] && !TarnOS.Routes[route]) return
      var obj = {}
      obj[route] = window[route] || TarnOS.Routes[route]
      TarnOS.Add(obj)
    }, allRoutes = []
    s.routes.map(function(route, index) {
      allRoutes = allRoutes.concat([
        link({href: 'routes/' + route + '/style.css', rel: 'stylesheet'}),
        script({src: 'routes/' + route + '/script.js', onload: function() {hd(route)} })
      ])
    })
    return allRoutes
  }

  function Load(strRoute) {
    // Return the route if it exists
    if(TarnOS.Routes[strRoute]) {
      return TarnOS.Routes[strRoute]
    }

    // Append the route if it doesn't exist
    if(Loader.data.routes.indexOf(strRoute) < 0) {
      Loader.data.routes.push(strRoute)
    }

    return Loading
  }

  // loading
  function Loading(p, s) {
    return div()
  }

  // nav bar
  function Nav(p, s) {
    var links = {
      Home: ['home', "Home", "Home"],
      Auth: ['phone', "Auth", "Auth"]
    }, curRoute = TarnOS.getRoute(0)

    return div.Side.Nav({}, Object.keys(links).map(function(name) {
      return a[name == curRoute ? 'active' : '']({
          href:'#' + name,
          title: links[name][2]
        }, span.Icon({
          innerHTML: icons[links[name][0]]
        }), span.Label({innerHTML: links[name][1]})
      )
    }))
  }

  // TarnOS app
  return {
    // Adds multiple routes to the route cache
    Add: function(routes) {
      Object.assign(TarnOS.Routes, routes)
      TarnOS.Loaded()
    },
    App: App,
    getRoute: function(index) {
      index = (typeof index == 'undefined') ? '' : index
      var parts = window.location.hash.substr(1).split('/')
      if(index === '') return parts
      if(!parts.length || !parts[0]) return 'Home'
      var retVal = decodeURI(parts[index] || '').replace(/_/g, ' ')
      return retVal == 'IsPreRender' ? 'Home' : retVal
    },
    Layout: Layout,
    Load: Load,
    LoadData(resp) {
      if(resp.user && !TarnOS.App.data.user) {
        TarnOS.App.data.user = resp.user

        if(resp.chats) {
          // Reverse the blocks for display purposes
          resp.chats.forEach((chat) => {
            chat.blocks.reverse()
          })
          TarnOS.App.data.chats = resp.chats
        }
      }
    },
    Loader: Loader,
    Loaded: function() {
      App.data.loading = !App.data.loading
    },
    Routes: {
      Home: function(p, s) {
        return "Home page placeholder"
      }
    }
  }

})()

window.onload = function() {

  // Set up the router
  function init(e) {

    var strHash = window.location.hash.split('#')[1];
    alert(strHash);

    // lastHash = e && e.oldURL ? ('#' + (e.oldURL.split('#')[1] || '')) : '#'
    // TarnOS.Layout.data.menu = false
    // TarnOS.Layout.draw()
  }

  window.onhashchange = init

  R(
    H(TarnOS.Loader),
    document.getElementById('meta')
  )

  R(
    H(TarnOS.Layout),
    document.getElementById('content')
  )

  setTimeout(init)

}
