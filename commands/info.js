'use strict';
let sprintf = require('sprintf-js');
let co = require('co');
let Heroku = require('heroku-client');
let filesize = require('filesize');
let _ = require('lodash');
let S = require('string');

function shellLine(name, value) {
  return `${S(name).slugify()}=${value}`;
}

function outputLine(name, value) {
  if (name) {
    name = name + ':';
  }
  return sprintf.sprintf('%-15s%s', name, value);
}

module.exports = {
  topic: '_apps',
  command: 'info',
  description: 'show detailed app information',
  hidden: true,
  needsApp: true,
  needsAuth: true,
  flags: [{name: 'shell', char: 's', description: 'output more shell friendly key/value pairs'}],
  run: function (context) {
    co(function *() {
      let line = outputLine;
      if (context.args.shell) {
        line = shellLine;
      }
      let heroku = new Heroku({token: context.auth.password});
      console.log(`=== ${context.app}`);
      let info = yield {
        addons: heroku.apps(context.app).addons().list(),
        app: heroku.apps(context.app).info(),
        dynos: heroku.apps(context.app).dynos().list()
      };
      let header = 'Addons';
      for (let addon of info.addons) {
        console.log(line(header, addon.plan.name));
        header = '';
      }
      console.log(line('Git URL', info.app.git_url));
      console.log(line('Owner', info.app.owner.email));
      console.log(line('Region', info.app.region.name));
      if (context.args.shell) {
        console.log(line('Repo Size', info.app.repo_size));
        console.log(line('Slug Size', info.app.slug_size));
      } else {
        console.log(line('Repo Size', filesize(info.app.repo_size, {round: 0})));
        console.log(line('Slug Size', filesize(info.app.slug_size, {round: 0})));
      }
      console.log(line('Stack', info.app.stack.name));
      console.log(line('Web URL', info.app.web_url));
      console.log(line('Dynos', info.dynos.length));
      _.forOwn(_.countBy(info.dynos, 'type'), function (count, type) {
        console.log(line(`  ${type}`, count));
      });
    }).catch(function (err) {
      console.error(err.stack);
    });
  }
};
