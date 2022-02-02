/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { live2d_view, LAppDelegate } from './lappdelegate';
import { LAppPal } from './lapppal';

function getElementTop(element) {
  var actualTop = element.offsetTop;
  var current = element.offsetParent;
  while (current !== null) {
    actualTop += current.offsetTop;
    current = current.offsetParent;
  }
  return actualTop;
}

function getElementLeft(element) {
  var actualLeft = element.offsetLeft;
  var current = element.offsetParent;
  while (current !== null) {
    actualLeft += current.offsetLeft;
    current = current.offsetParent;
  }
  return actualLeft;
}

export class ResetExpression {
  constructor() {
    this.enable = true;
    this.time = 5000;
    this.run = false;
    this.name = null;
  }
  public enable: boolean;
  public run: boolean;
  public time: number;
  public name: string;
}

export class Live2dAPI {
  public delegate: LAppDelegate;
  public path: string;
  public resetExpression: ResetExpression;
  public view: HTMLCanvasElement;

  move;
  down;

  constructor() {
    let api = this;
    this.delegate = new LAppDelegate(this);
    this.resetExpression = new ResetExpression();
    this.move = function (a: MouseEvent) {
      api.touchMoved(a.x, a.y);
    }
    this.down = function (a: MouseEvent) {
      api.touchEnded(a.x, a.y);
    }
  }

  public init() {
    if (this.delegate.initialize() == false) {
      return false;
    }
    this.view = live2d_view;
    let liveapi = this;
    this.view.onresize = function () {
      liveapi.delegate.onResize();
    }
    live2d_view.style.position = "fixed";
    live2d_view.style.right = "0px";
    live2d_view.style.bottom = "0px"
    return true;
  }

  public run() {
    this.delegate.run();
  }

  public close() {
    this.delegate.release();
  }

  public scale(size: number) {
    this.delegate._manager._scale = size;
  }

  public setX(x: number) {
    this.delegate._manager._x = x;
  }

  public setY(y: number) {
    this.delegate._manager._y = y;
  }

  public setXY(x: number, y: number) {
    this.delegate._manager._x = x;
    this.delegate._manager._y = y;
  }

  public resize(width: number = 0, height: number = 0) {
    this.delegate.onResize(width, height);
  }

  public changeModel(name: string, path: string) {
    if (path == null) {
      if (this.path == null) {
        return false;
      }
      this.delegate.getManager().loadModel(name, this.path);
    }
    else {
      this.path = path;
      this.delegate.getManager().loadModel(name, path);
    }
    let liveapi = this;
    let timer = setTimeout(function () {
      let list = liveapi.getExpressions();
      if (list == null) {
        LAppPal.printMessage(`[APP]no expression`);
        return;
      }
      list.forEach(item => {
        if (item.name.toLowerCase() == "normal")
          liveapi.resetExpression.name = item[0].name;
      });
      if (!liveapi.resetExpression.name) {
        LAppPal.printMessage(`[APP]no found default expression, set 0`);
        liveapi.resetExpression.name = list[0].name;
      }
      clearInterval(timer);
    }, 200);
    return true;
  }

  public fixPos(x: number, y: number) {
    let width = live2d_view.width;
    let height = live2d_view.height;
    let posX = getElementLeft(live2d_view);
    let posY = getElementTop(live2d_view);
    let fixX = posX + width;
    let fixY = posY + height;
    let width1 = window.innerWidth;
    let height1 = window.innerHeight;

    const range = 50;

    if (x < posX) {
      x = -((posX - x) / posX * range);
    } else if (x >= posX && x <= fixX) {
      x = x - posX;
    }
    else {
      x = width + ((x - fixX) / (width1 - fixX) * range);
    }

    if (y < posY) {
      y = -((posY - y) / posY * range);
    } else if (y >= posY && x <= fixY) {
      y = y - posY;
    }
    else {
      y = height + ((y - fixY) / (height1 - fixY) * range);
    }

    return [x, y];
  }

  public touchesBegan(x: number, y: number) {
    let view = this.delegate.getView();
    if (view == null) {
      return false;
    }
    [x, y] = this.fixPos(x, y);

    view.onTouchesBegan(x, y);
    return true;
  }

  public touchMoved(x: number, y: number) {
    let view = this.delegate.getView();
    if (view == null) {
      return false;
    }
    [x, y] = this.fixPos(x, y);

    view.onTouchesMoved(x, y);
    return true;
  }

  public touchEnded(x: number, y: number) {
    let view = this.delegate.getView();
    if (view == null) {
      return false;
    }
    [x, y] = this.fixPos(x, y);

    view.onTouchesEnded(x, y);
    return true;
  }

  public setOnTap(fun) {
    this.delegate._manager.setOnTap(fun);
  }

  public addListener() {
    addEventListener("mousemove", this.move);
    addEventListener("mousedown", this.down);
  }

  public removeListener() {
    removeEventListener("mousemove", this.move);
    removeEventListener("mousedown", this.down);
  }

  public getMotions() {
    let model = this.delegate.getManager().getModel();
    if (model == null) {
      return null;
    }

    let set = model.getModelSetting();
    if (set == null)
      return null;
    let count1 = set.getMotionGroupCount();
    if (count1 == 0)
      return null;
    let list = new Array();
    for (let a = 0; a < count1; a++) {
      let list1 = new Array();
      let item = set.getMotionGroupName(a);
      let count2 = set.getMotionCount(item);
      for (let b = 0; b < count2; b++) {
        let item1 = set.getMotionFileName(item, b);
        list1[b] = item1;
      }
      list[item] = list1;
    }

    return list;
  }

  public getExpressions() {
    let model = this.delegate.getManager().getModel();
    if (model == null) {
      return null;
    }

    let set = model.getModelSetting();
    if (set == null)
      return null;
    let count1 = set.getExpressionCount();
    if (count1 == 0)
      return null;
    let list = new Array();
    for (let a = 0; a < count1; a++) {
      let item = set.getExpressionName(a);
      let item1 = set.getExpressionFileName(a);
      list[a] = {
        name: item,
        file: item1
      };
    }
    return list;
  }

  public startMotion(group: string, no: number, priority: number) {
    let model = this.delegate.getManager().getModel();
    if (model == null) {
      return false;
    }

    model.startMotion(group, no, priority);
    return true;
  }

  public startExpression(name: string) {
    let model = this.delegate.getManager().getModel();
    if (model == null) {
      return false;
    }
    model.setExpression(name);
    return true;
  }

  public tickResetExpression() {
    if (this.resetExpression.run == true)
      return;
    let model = this.delegate.getManager().getModel();
    if (model != null) {
      if (this.resetExpression.enable == true && this.resetExpression.name != null) {
        this.resetExpression.run = true;
        let liveapi = this;
        let timer = setTimeout(function () {
          LAppPal.printMessage(`[APP]expression reset ${liveapi.resetExpression.name}`);
          model.setExpression(liveapi.resetExpression.name);
          this.resetExpression.run = false;
          clearInterval(timer);
        }, this.resetExpression.time);
      }
    }
  }
}

console.log("live2dAPI init");
window["live2d"] = {
  new: function () {
    return new Live2dAPI();
  }
}