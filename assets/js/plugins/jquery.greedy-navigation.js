/*
GreedyNav.js - http://lukejacksonn.com/actuate
Licensed under the MIT license - http://opensource.org/licenses/MIT
Copyright (c) 2015 Luke Jackson
*/
$(function(){function e(){function e(e,n){i+=n,t+=1,d.push(i)}function n(n){var t=n.clone();t.css("visibility","hidden"),r.append(t),e(0,t.outerWidth()),t.remove()}t=0,i=0,o=1e3,d=[],r.children().outerWidth(e),l.children().each(function(){n($(this))})}function n(){var i=(m=$(window).width())<768?0:m<1024?1:m<1280?2:3;i!==W&&e(),W=i,f=r.children().length,v=h.innerWidth()-(0!==s.length?s.outerWidth(!0):0)-u.outerWidth(!0)-(0!==g.length?g.outerWidth(!0):0)-(f!==d.length?a.outerWidth(!0):0),d[f-1]>v?(r.children().last().prependTo(l),f-=1,n()):v+(f===d.length-1?a.outerWidth(!0):0)>d[f]&&(l.children().first().appendTo(r),f+=1,n()),a.attr("count",t-f),f===t?a.addClass("hidden"):a.removeClass("hidden")}var t,i,o,d,a=$("nav.greedy-nav .greedy-nav__toggle"),r=$("nav.greedy-nav .visible-links"),l=$("nav.greedy-nav .hidden-links"),h=$("nav.greedy-nav"),s=$("nav.greedy-nav .site-logo"),c=$("nav.greedy-nav .site-logo img"),u=$("nav.greedy-nav .site-title"),g=$("nav.greedy-nav button.search__toggle");e();var v,f,y,m=$(window).width(),W=m<768?0:m<1024?1:m<1280?2:3;$(window).resize(function(){n()}),a.on("click",function(){l.toggleClass("hidden"),$(this).toggleClass("close"),clearTimeout(y)}),l.on("mouseleave",function(){y=setTimeout(function(){l.addClass("hidden")},o)}).on("mouseenter",function(){clearTimeout(y)}),0!==c.length?c[0].complete||0!==c[0].naturalWidth?n():c.one("load error",n):n()});