// Demo.js -- Demonstrate some of the features of ShellInABox
// Copyright (C) 2008-2009 Markus Gutschke <markus@shellinabox.com>
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License version 2 as
// published by the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along
// with this program; if not, write to the Free Software Foundation, Inc.,
// 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
//
// In addition to these license terms, the author grants the following
// additional rights:
//
// If you modify this program, or any covered work, by linking or
// combining it with the OpenSSL project's OpenSSL library (or a
// modified version of that library), containing parts covered by the
// terms of the OpenSSL or SSLeay licenses, the author
// grants you additional permission to convey the resulting work.
// Corresponding Source for a non-source form of such a combination
// shall include the source code for the parts of OpenSSL used as well
// as that of the covered work.
//
// You may at your option choose to remove this additional permission from
// the work, or from any part of it.
//
// It is possible to build this program in a way that it loads OpenSSL
// libraries at run-time. If doing so, the following notices are required
// by the OpenSSL and SSLeay licenses:
//
// This product includes software developed by the OpenSSL Project
// for use in the OpenSSL Toolkit. (http://www.openssl.org/)
//
// This product includes cryptographic software written by Eric Young
// (eay@cryptsoft.com)
//
//
// The most up-to-date version of this program is always available from
// http://shellinabox.com
//
//
// Notes:
//
// The author believes that for the purposes of this license, you meet the
// requirements for publishing the source code, if your web server publishes
// the source in unmodified form (i.e. with licensing information, comments,
// formatting, and identifier names intact). If there are technical reasons
// that require you to make changes to the source code when serving the
// JavaScript (e.g to remove pre-processor directives from the source), these
// changes should be done in a reversible fashion.
//
// The author does not consider websites that reference this script in
// unmodified form, and web servers that serve this script in unmodified form
// to be derived works. As such, they are believed to be outside of the
// scope of this license and not subject to the rights or restrictions of the
// GNU General Public License.
//
// If in doubt, consult a legal professional familiar with the laws that
// apply in your country.

// #define STATE_IDLE     0
// #define STATE_INIT     1
// #define STATE_PROMPT   2
// #define STATE_READLINE 3
// #define STATE_COMMAND  4
// #define STATE_EVAL     5
// #define STATE_EXEC     6
// #define STATE_NEW_Y_N  7

// #define TYPE_STRING    0
// #define TYPE_NUMBER    1
// #define TYPE_VAR       2
// #define TYPE_STRVAR    3
// #define TYPE_INTVAR    4
// #define TYPE_ARR       5
// #define TYPE_STRARR    6
// #define TYPE_INTARR    7

function extend(subClass, baseClass) {
  function inheritance() { }
  inheritance.prototype          = baseClass.prototype;
  subClass.prototype             = new inheritance();
  subClass.prototype.constructor = subClass;
  subClass.prototype.superClass  = baseClass.prototype;
};

function Demo(container) {
  this.superClass.constructor.call(this, container);
  this.gotoState(1 /* STATE_INIT */);
};
extend(Demo, VT100);

Demo.prototype.keysPressed = function(ch) {
  if (this.state == 6 /* STATE_EXEC */) {
    for (var i = 0; i < ch.length; i++) {
      var c       = ch.charAt(i);
      if (c == '\u0003') {
        this.keys = '';
        this.error('Interrupted');
        return;
      }
    }
  }
  this.keys      += ch;
  this.gotoState(this.state);
};

Demo.prototype.gotoState = function(state, tmo) {
  this.state       = state;
  if (!this.timer || tmo) {
    if (!tmo) {
      tmo          = 1;
    }
    this.nextTimer = setTimeout(function(demo) {
                                  return function() {
                                    demo.demo();
                                  };
                                }(this), tmo);
  }
};

Demo.prototype.demo = function() {
  var done                  = false;
  this.nextTimer            = undefined;
  while (!done) {
    var state               = this.state;
    this.state              = 0 /* STATE_IDLE */;
    switch (state) {
    case 1 /* STATE_INIT */:
      done                  = this.doInit();
      break;
    case 2 /* STATE_PROMPT */:
      done                  = this.doPrompt();
      break;
    case 3 /* STATE_READLINE */:
      done                  = this.doReadLine();
      break;
    case 4 /* STATE_COMMAND */:
      done                  = this.doCommand();
      break;
    case 5 /* STATE_EVAL */:
      done                  = this.doEval();
      break;
    case 6 /* STATE_EXEC */:
      done                  = this.doExec();
      break;
    case 7 /* STATE_NEW_Y_N */:
      done                  = this.doNewYN();
      break;
    case 0 /* STATE_IDLE */:
    default:
      done                  = true;
      break;
    }
  }
  this.timer                = this.nextTimer;
  this.nextTimer            = undefined;
};

Demo.prototype.ok = function() {
  this.vt100('OK\r\n');
  this.gotoState(2 /* STATE_PROMPT */);
};

Demo.prototype.error = function(msg) {
  if (msg == undefined) {
    msg                 = 'Syntax Error';
  }
  this.vt100((this.cursorX != 0 ? '\r\n' : '') + '\u0007? ' + msg + '\r\n');
  this.gotoState(2 /* STATE_PROMPT */);
  this.currentLineIndex = -1;
  return undefined;
};

Demo.prototype.doInit = function() {
  this.program = new Array();
  this.vt100(
    '\u001Bc\u001B[34;4m' +
    'ShellInABox Demo Script\u001B[24;31m\r\n' +
    '\r\n' +
    'Copyright 2009 by Markus Gutschke <markus@shellinabox.com>\u001B[0m\r\n' +
    '\r\n' +
    '\r\n' +
    'This script simulates a minimal BASIC interpreter, allowing you to\r\n' +
    'experiment with the JavaScript terminal emulator that is part of\r\n' +
    'the ShellInABox project.\r\n' +
    '\r\n' +
    'Type HELP for a list of commands.\r\n' +
    '\r\n');
  this.gotoState(2 /* STATE_PROMPT */);
  return false;
};

Demo.prototype.doPrompt = function() {
  this.keys             = '';
  this.line             = '';
  this.currentLineIndex = -1;
  this.vt100('> ');
  this.gotoState(3 /* STATE_READLINE */);
  return false;
};

Demo.prototype.doReadLine = function() {
  this.gotoState(3 /* STATE_READLINE */);
  var keys  = this.keys;
  this.keys = '';
  for (var i = 0; i < keys.length; i++) {
    var ch  = keys.charAt(i);
    if (ch >= ' ' && ch < '\u007F' || ch > '\u00A0') {
      this.line += ch;
      this.vt100(ch);
    } else if (ch == '\r' || ch == '\n') {
      this.vt100('\r\n');
      this.gotoState(4 /* STATE_COMMAND */);
      return false;
    } else if (ch == '\u0008' || ch == '\u007F') {
      if (this.line.length > 0) {
        this.line = this.line.substr(0, this.line.length - 1);
        if (this.cursorX == 0) {
          var x = this.terminalWidth - 1;
          var y = this.cursorY - 1;
          this.gotoXY(x, y);
          this.vt100(' ');
          this.gotoXY(x, y);
        } else {
          this.vt100('\u0008 \u0008');
        }
      } else {
        this.vt100('\u0007');
      }
    } else if (ch == '\u001B') {
      // This was probably a function key. Just eat all of the following keys.
      break;
    }
  }
  return true;
};

Demo.prototype.doCommand = function() {
  this.gotoState(2 /* STATE_PROMPT */);
  var tokens              = new this.Tokens(this.line);
  this.line               = '';
  var cmd                 = tokens.nextToken();
  if (cmd) {
    cmd                   = cmd;
    if (cmd.match(/^[0-9]+$/)) {
      tokens.removeLineNumber();
      var lineNumber        = parseInt(cmd);
      var index             = this.findLine(lineNumber);
      if (tokens.nextToken() == null) {
        if (index > 0) {
          // Delete line from program
          this.program.splice(index, 1);
        }
      } else {
        if (index >= 0) {
          // Replace line in program
          this.program[index].setTokens(tokens);
        } else {
          // Add new line to program
          this.program.splice(-index - 1, 0,
                              new this.Line(lineNumber, tokens));
        }
      }
    } else {
      this.currentLineIndex = -1;
      this.tokens           = tokens;
      this.gotoState(5 /* STATE_EVAL */);
    }
  }
  tokens.reset();
  return false;
};

Demo.prototype.doEval = function() {
  this.gotoState(2 /* STATE_PROMPT */);
  var token                 = this.tokens.nextToken();
  if (token == "HELP") {
    this.vt100('Supported commands:\r\n' +
               '  HELP LIST NEW PRINT RUN\r\n');
  } else if (token == "LIST") {
    this.doList();
  } else if (token == "NEW") {
    if (this.currentLineIndex >= 0) {
      this.error('Cannot call NEW from a program');
    } else if (this.program.length == 0) {
      this.ok();
    } else {
      this.vt100('Do you really want to delete the program (y/N) ');
      this.gotoState(7 /* STATE_NEW_Y_N */);
    }
  } else if (token == "PRINT" || token == "?") {
    this.doPrint();
  } else if (token == "RUN") {
    if (this.tokens.nextToken() != null) {
      this.error();
    } else if (this.program.length > 0) {
      this.currentLineIndex = 0;
      this.gotoState(6 /* STATE_EXEC */);
    } else {
      this.ok();
    }
  } else {
    this.error();
  }
  return false;
};

Demo.prototype.doList = function() {
  var start        = undefined;
  var stop         = undefined;
  var token        = this.tokens.nextToken();
  if (token) {
    if (!token.match(/[0-9]+/)) {
      return this.error();
    }
    start          = parseInt(token);
    token          = this.tokens.nextToken();
    if (token) {
      if (token != ',') {
        return this.error();
      }
      token        = this.tokens.nextToken();
      if (!token || !token.match(/[0-9]+/)) {
        return this.error();
      }
      stop         = token.parseInt(token);
      if (stop < start) {
        return this.error();
      }
    }
  }

  for (var i = 0; i < this.program.length; i++) {
    var line       = this.program[i];
    var lineNumber = line.lineNumber();
    if (start != undefined && start > lineNumber) {
      continue;
    }
    if (stop != undefined && stop < lineNumber) {
      break;
    }

    this.vt100('' + line.lineNumber() + ' ');
    line.tokens().reset();
    var space      = true;
    var id         = false;
    for (var token; (token = line.tokens().nextToken()) != null; ) {
      switch (token) {
        case '=':
        case '+':
        case '-':
        case '*':
        case '/':
        case '\\':
        case '^':
          this.vt100((space ? '' : ' ') + token + ' ');
          space    = true;
          id       = false;
          break;
        case '(':
        case ')':
        case '?':
        case '$':
        case '%':
        case '#':
          this.vt100(token);
          space    = false;
          id       = false;
          break;
        case ',':
        case ';':
        case ':':
          this.vt100(token + ' ');
          space    = true;
          id       = false;
          break;
        default:
          this.vt100((id ? ' ' : '') + token);
          space    = false;
          id       = true;
          break;
      }
    }
    this.vt100('\r\n');
  }
};

Demo.prototype.doPrint = function() {
  var tokens    = this.tokens;
  var last      = undefined;
  for (var token; (token = tokens.peekToken()); ) {
    last        = token;
    if (token == ',') {
      this.vt100('\t');
      tokens.consume();
    } else if (token == ';') {
      // Do nothing
      tokens.consume();
    } else {
      var value = this.expr();
      if (value == undefined) {
        return;
      }
      this.vt100(value.toString());
    }
  }
  if (last != ';') {
    this.vt100('\r\n');
  }
};

Demo.prototype.doExec = function() {
  this.tokens = this.program[this.currentLineIndex++].tokens();
  this.tokens.reset();
  this.doEval();
  if (this.currentLineIndex < 0) {
    return false;
  } else if (this.currentLineIndex >= this.program.length) {
    this.ok();
    return false;
  } else {
    this.gotoState(6 /* STATE_EXEC */, 20);
    return true;
  }
};

Demo.prototype.doNewYN = function() {
  for (var i = 0; i < this.keys.length; ) {
    var ch = this.keys.charAt(i++);
    if (ch == 'n' || ch == 'N' || ch == '\r' || ch == '\n') {
      this.vt100('N\r\n');
      this.keys = this.keys.substr(i);
      this.error('Aborted');
      return false;
    } else if (ch == 'y' || ch == 'Y') {
      this.vt100('Y\r\n');
      this.program.splice(0, this.program.length);
      this.keys = this.keys.substr(i);
      this.ok();
      return false;
    } else {
      this.vt100('\u0007');
    }
  }
  this.gotoState(7 /* STATE_NEW_Y_N */);
  return true;
};

Demo.prototype.findLine = function(lineNumber) {
  var l   = 0;
  var h   = this.program.length;
  while (h > l) {
    var m = Math.floor((l + h) / 2);
    var n = this.program[m].lineNumber();
    if (n == lineNumber) {
      return m;
    } else if (n > lineNumber) {
      h   = m;
    } else {
      l   = m + 1;
    }
  }
  return -l - 1;
};

Demo.prototype.expr = function() {
  var token = this.tokens.nextToken();
  if (!token) {
    return token;
  }

  var value = undefined;
  var str;
  if ((str = token.match(/^"(.*)"/)) != null) {
    value   = new this.Value(0 /* TYPE_STRING */, str[1]);
  } else {
    return this.error();
  }

  return value;
};

Demo.prototype.Tokens = function(line) {
  this.line   = line;
  this.tokens = line;
  this.len    = undefined;
};

Demo.prototype.Tokens.prototype.peekToken = function() {
  this.len      = undefined;
  this.tokens   = this.tokens.replace(/^[ \t]*/, '');
  var tokens    = this.tokens;
  if (!tokens.length) {
    return null;
  }
  var token     = tokens.charAt(0);
  switch (token) {
  case '<':
    if (tokens.length > 1) {
      if (tokens.charAt(1) == '>') {
        token   = '<>';
      } else if (tokens.charAt(1) == '=') {
        token   = '<=';
      }
    }
    break;
  case '>':
    if (tokens.charAt(1) == '=') {
      token     = '>=';
    }
    break;
  case '=':
  case '+':
  case '-':
  case '*':
  case '/':
  case '\\':
  case '^':
  case '(':
  case ')':
  case '?':
  case ',':
  case ';':
  case ':':
  case '$':
  case '%':
  case '#':
    break;
  case '"':
    token       = tokens.match(/"((?:""|[^"])*)"/); // "
    if (!token) {
      token     = undefined;
    } else {
      this.len  = token[0].length;
      token     = '"' + token[1].replace(/""/g, '"') + '"';
    }
    break;
  default:
    if (token >= '0' && token <= '9' || token == '.') {
      token     = tokens.match(/^[0-9]*(?:[.][0-9]*)?(?:[eE][-+]?[0-9]+)?/);
      if (!token) {
        token   = undefined;
      } else {
        token   = token[0];
      }
    } else if (token >= 'A' && token <= 'Z' ||
               token >= 'a' && token <= 'z') {
      token     = tokens.match(/^[A-Za-z][A-Za-z0-9_]*/);
      if (!token) {
        token   = undefined;
      } else {
        token   = token[0].toUpperCase();
      }
    } else {
      token     = '';
    }
  }

  if (this.len == undefined) {
    if (token) {
      this.len  = token.length;
    } else {
      this.len  = 1;
    }
  }

  return token;
};

Demo.prototype.Tokens.prototype.consume = function() {
  if (this.len) {
    this.tokens = this.tokens.substr(this.len);
    this.len    = undefined;
  }
};

Demo.prototype.Tokens.prototype.nextToken = function() {
  var token = this.peekToken();
  this.consume();
  return token;
};

Demo.prototype.Tokens.prototype.removeLineNumber = function() {
  this.line = this.line.replace(/^[0-9]*[ \t]*/, '');
};

Demo.prototype.Tokens.prototype.reset = function() {
  this.tokens = this.line;
};

Demo.prototype.Line = function(lineNumber, tokens) {
  this.lineNumber_ = lineNumber;
  this.tokens_     = tokens;
};

Demo.prototype.Line.prototype.lineNumber = function() {
  return this.lineNumber_;
};

Demo.prototype.Line.prototype.tokens = function() {
  return this.tokens_;
};

Demo.prototype.Line.prototype.setTokens = function(tokens) {
  this.tokens_ = tokens;
};

Demo.prototype.Line.prototype.sort = function(a, b) {
  return a.lineNumber_ - b.lineNumber_;
};

Demo.prototype.Value = function(type, str) {
  this.type = type;
  this.str  = str;
};

Demo.prototype.Value.prototype.toString = function() {
  return this.str;
};