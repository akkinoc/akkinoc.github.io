/*!
 * jQuery throttle / debounce - v1.1 - 3/7/2010
 * http://benalman.com/projects/jquery-throttle-debounce-plugin/
 * 
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */
// Copyright (c) 2010 "Cowboy" Ben Alman,
!function(n,t){"$:nomunge";var o,u=n.jQuery||n.Cowboy||(n.Cowboy={});u.throttle=o=function(n,o,e,i){function r(){function u(){c=+new Date,e.apply(f,g)}function r(){a=t}var f=this,d=+new Date-c,g=arguments;i&&!a&&u(),a&&clearTimeout(a),i===t&&d>n?u():!0!==o&&(a=setTimeout(i?r:u,i===t?n-d:n))}var a,c=0;return"boolean"!=typeof o&&(i=e,e=o,o=t),u.guid&&(r.guid=e.guid=e.guid||u.guid++),r},u.debounce=function(n,u,e){return e===t?o(n,u,!1):o(n,e,!1!==u)}}(this);