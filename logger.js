const chalk = require('chalk');

const INFO_VERBOSE = false;
const SPACE_SIZE = 10;
const SPACER = ' ';

const COLORS = {
  BLUE: 'blue',
  RED: 'red',
  CYAN: 'cyan',
  MAGENTA: 'magenta',
  YELLOW: 'yellow',
  GREEN: 'green',
  WHITE: 'white',
  GRAY: 'gray'
};

const MessageTypes = {
  INSTRUCTION: {
    color: COLORS.CYAN,
    bright: true,
    underline: false,
    bold: false
  },
  STATUS: {
    color: COLORS.YELLOW,
    bright: false,
    underline: false,
    bold: false
  },
  STATUS_COMPLETE: {
    color: COLORS.GREEN,
    bright: true,
    underline: false,
    bold: false
  },
  INFO: {
    color: COLORS.GRAY,
    bright: false,
    underline: false,
    bold: false
  },
  UPDATE: {
    color: COLORS.YELLOW,
    bright: true,
    underline: false,
    bold: false
  },
  PASS: {
    color: COLORS.GREEN,
    bright: true,
    underline: false,
    bold: false
  },
  FAIL: {
    color: COLORS.RED,
    bright: true,
    underline: false,
    bold: false
  },
  ERROR: {
    color: COLORS.RED,
    bright: true,
    underline: false,
    bold: false
  },
  TITLE: {
    color: COLORS.MAGENTA,
    bright: true,
    underline: true,
    bold: true
  }
};

exports.COLORS = COLORS;
exports.MessageTypes = MessageTypes;

exports.Logger = class Logger {

  constructor(
    tag,
    verbose = true,
    color = COLORS.WHITE,
    bright = false,
    bold = false,
    underline = false) {
    this.TAG = tag;
    this.color = color;
    this.bright = bright;
    this.bold = bold;
    this.underline = underline;
    this.verbose = verbose;

    this.defaultConfig = {
      color: this.color,
      bright: this.bright,
      bold: this.bold,
      underline: this.underline
    };
  }

  getGroup() {
    return exports.Logger.group;
  }

  addGroup(num = 1) {
    this.info(`addGroup(): group = ${exports.Logger.group} -> ${exports.Logger.group + 1}`);
    this.setGroup(exports.Logger.group + num);
    return null;
  }

  endGroup(num = 1) {
    this.info(`endGroup(): group = ${exports.Logger.group} -> ${exports.Logger.group - 1}`);
    this.setGroup(exports.Logger.group - num);
    return null;
  }

  // TODO: error handling
  setGroup(group) {
    if (exports.Logger.group != group) {

      while (exports.Logger.group < group) {
        console.group();
        exports.Logger.group += 1;
      }

      while (exports.Logger.group > group) {
        console.groupEnd();
        exports.Logger.group -= 1;
      }
    }
  }

  // print info message
  info(msg, vebose = INFO_VERBOSE) {
    if (INFO_VERBOSE) {
      let group = this.getGroup();
      this.setGroup(0);
      if (this.verbose && vebose)
        console.log(`${chalk.gray.bold(this.format(`[${this.TAG}]`, SPACE_SIZE, false))} ${chalk.gray(msg)}`);
      this.setGroup(group);
    }
  }

  // print message with chalk configs
  log(msg, config = this.defaultConfig, group = exports.Logger.group) {
    this.setGroup(group);
    let formattedMsg = [];
    try {
      formattedMsg.push(`chalk.`);
      formattedMsg.push(`${config.color}`);
      formattedMsg.push(`${config.bright ? 'Bright' : ''}`);
      formattedMsg.push(`${config.bold ? '.bold' : ''}`);
      formattedMsg.push(`${config.underline ? '.underline' : ''}`);
      formattedMsg.push(`('${msg}')`);

      console.log(eval(formattedMsg.join('')));
    } catch (e) {
      console.log(chalk.redBright("\tLogger.log() error"));
      console.log(e);
      // this.error(`Error printing: ${formattedMsg.join('')}`);
    };
  }

  // log literal
  // TODO: error handling
  logChalkLiteral(msg, group = exports.Logger.group) {
    this.setGroup(group);
    console.log(eval(msg));
  }

  // log chalked message
  logChalkMsg(msg, group = exports.Logger.group) {
    this.setGroup(group);
    console.log(msg);
  }

  // print title message
  title(msg, config = MessageTypes.TITLE, group = exports.Logger.group) {
    this.log(msg, config, group);
  }

  // print status message
  status(msg, config = MessageTypes.STATUS, group = exports.Logger.group) {
    this.log(msg, config, group);
  }

  // print status message
  instruction(msg, config = MessageTypes.INSTRUCTION, group = exports.Logger.group) {
    this.log(msg, config, group);
  }

  // print status message
  update(msg, config = MessageTypes.UPDATE, group = exports.Logger.group) {
    this.log(msg, config, group);
  }

  // print status message
  complete(msg, config = MessageTypes.STATUS_COMPLETE, group = exports.Logger.group) {
    this.log(msg, config, group);
  }

  // print status message
  error(msg, config = MessageTypes.ERROR, group = exports.Logger.group) {
    this.log(msg, config, group);
  }

  // get chalked message
  getChalkMsg(msg, color = this.color, bright = this.bright, bold = false, underline = false) {
    // let newMsg = `chalk.${color}${(bright ? 'Bright' : '')}('${msg}')`;

    let formattedMsg = [];
    try {
      formattedMsg.push(`chalk.`);
      formattedMsg.push(`${color}`);
      formattedMsg.push(`${bright ? 'Bright' : ''}`);
      formattedMsg.push(`${bold ? '.bold' : ''}`);
      formattedMsg.push(`${underline ? '.underline' : ''}`);
      formattedMsg.push(`('${msg}')`);

      // console.log(formattedMsg.join(''));
      return eval(formattedMsg.join(''));
    } catch (e) {
      console.log(chalk.redBright("\tLogger.getChalkMsg() error"));
    }
    // return eval(newMsg);
  }

  // format non chalked message
  format(msg, size = SPACE_SIZE, centered = true, spacer = SPACER) {
    let field = spacer.repeat(size);
    // console.log(`msg = ${msg}`);
    msg = msg.toString();
    let length = msg.length;

    if (centered) {
      let startPosition = Math.floor((size - length) / 2);
      startPosition = startPosition < 0 ? 0 : startPosition;

      field = spacer.repeat(startPosition) + msg.substring(0, size) + spacer.repeat((size - length - startPosition) < 0 ? 0 : (size - length - startPosition));
    } else {
      field = msg.substring(0, size) + field.substring(msg.length, size);
    }
    return field;
  }

  // TODO: 
  trimURL(url, len) {
    let offest = 10;
    let firstLen = len / 2 + offest;
    return url.substr(0, firstLen - 3) +
      '...' +
      url.substr(url.length - (len - firstLen), len - firstLen + 3);
  }

  setColor(color) {
    this.color = color;
  }

  setBright(bright) {
    this.bright = bright;
  }

  // print table with no formatting
  printTable(table, delimiter = ' ') {
    table.forEach(row => {
      this.logChalkMsg(row);
      // this.log(row.join(delimiter));
    });
  }

  line(num = 1) {
    for (let i = 0; i < num; i++)
      console.log('');
  }
}

exports.Logger.group = 0;