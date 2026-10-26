
import pkg from './package.json' with { type: 'json' };

export default {
  name: pkg.name,
  triggers: {
    keywords: [
      'npm',
      'package info',
      'packages like',
      'compare packages',
      'find npm packages',
    ],
  },
  query_format: {
    regex: [
      '(npm( packages?)?|npm package info|package info) HD_PACKAGES.NPM_PACKAGES',
      '(show me )?(what is )?(the )?(latest|current) version of HD_PACKAGES.NPM_PACKAGES',
      'compare( npm)?( packages?)? HD_PACKAGES.NPM_PACKAGES(,| vs| versus| and)? HD_PACKAGES.NPM_PACKAGES((,| vs| versus| and)? HD_PACKAGES.NPM_PACKAGES)?',
      '(npm )?(alternatives?( to| for)|packages? (like|similar to)) HD_PACKAGES.NPM_PACKAGES( npm)?',
      'find( npm)? packages? for HD_PACKAGES.NPM_PACKAGES',
      '(what is )?(the )?(license|description|repository) (for|of) HD_PACKAGES.NPM_PACKAGES',
    ],
  },
  client: {
    location: pkg.module,
    moduleName: pkg.umdName || 'HD' + pkg.name,
    baseURL: '/' + pkg.name,
  },
  format: {
    mainline: true,
    sidebar: true,
  },
  permissions: {},
  info: {},
  github: 'https://github.com/Shivaninandyala/PackageLens',
  demovideo: 'https://youtu.be/Jbwd-u0_0K8?si=x9QJZ_oDAvf09gcG',
};
