/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismMatrix44 } from '@framework/math/cubismmatrix44';
import { ACubismMotion } from '@framework/motion/acubismmotion';

import * as LAppDefine from './lappdefine';
import { LAppDelegate, live2d_view } from './lappdelegate';
import { LAppModel } from './lappmodel';
import { LAppPal } from './lapppal';
import { Live2dAPI } from './main';

/**
 * サンプルアプリケーションにおいてCubismModelを管理するクラス
 * モデル生成と破棄、タップイベントの処理、モデル切り替えを行う。
 */
export class LAppLive2DManager {
  /**
   * 現在のシーンで保持しているモデルを返す。
   *
   * @return モデルのインスタンスを返す。インデックス値が範囲外の場合はNULLを返す。
   */
  public getModel(): LAppModel {
    return this._model;
  }

  /**
   * 現在のシーンで保持しているすべてのモデルを解放する
   */
  public releaseAllModel(): void {
    this._model?.release();
  }

  /**
   * 画面をドラッグした時の処理
   *
   * @param x 画面のX座標
   * @param y 画面のY座標
   */
  public onDrag(x: number, y: number): void {
    if (this._model) {
      this._model.setDragging(x, y);
    }
  }

  /**
   * 画面をタップした時の処理
   *
   * @param x 画面のX座標
   * @param y 画面のY座標
   */
  public onTap(x: number, y: number): void {
    if (this._onTap != null) {
      this._onTap(x, y);
      return;
    }
    if (LAppDefine.DebugLogEnable) {
      LAppPal.printMessage(
        `[APP]tap point: {x: ${x.toFixed(2)} y: ${y.toFixed(2)}}`
      );
    }

    if (this._model.hitTest(LAppDefine.HitAreaNameHead, x, y)) {
      if (LAppDefine.DebugLogEnable) {
        LAppPal.printMessage(
          `[APP]hit area: [${LAppDefine.HitAreaNameHead}]`
        );
      }
      this._model.setRandomExpression();
    } else if (this._model.hitTest(LAppDefine.HitAreaNameBody, x, y)) {
      if (LAppDefine.DebugLogEnable) {
        LAppPal.printMessage(
          `[APP]hit area: [${LAppDefine.HitAreaNameBody}]`
        );
      }
      this._model
        .startRandomMotion(
          LAppDefine.MotionGroupTapBody,
          LAppDefine.PriorityNormal,
          this._finishedMotion
        );
    }
  }

  /**
   * 画面を更新するときの処理
   * モデルの更新処理及び描画処理を行う
   */
  public onUpdate(): void {
    if (!this._model)
      return;
    const { width, height } = live2d_view;

    const projection: CubismMatrix44 = new CubismMatrix44();

    if (this._model.getModel()) {
      projection.translateX(this._x);
      projection.translateY(this._y);

      if (this._model.getModel().getCanvasWidth() > 1.0 && width < height) {
        // 横に長いモデルを縦長ウィンドウに表示する際モデルの横サイズでscaleを算出する
        this._model.getModelMatrix().setWidth(2.0);
        projection.scale(this._scale, this._scale);
      } else {
        projection.scale(this._scale, this._scale);
      }

      // 必要があればここで乗算
      if (this._viewMatrix != null) {
        projection.multiplyByMatrix(this._viewMatrix);
      }
    }

    this._model.update();
    this._model.draw(projection); // 参照渡しなのでprojectionは変質する。
  }

  /**
   * シーンを切り替える
   * サンプルアプリケーションではモデルセットの切り替えを行う。
   */
  public changeScene(): void {
    this.releaseAllModel();
  }

  public loadModel(model: string, path: string) {
    if (LAppDefine.DebugLogEnable) {
      LAppPal.printMessage(`[APP]model load: ${path}/${model}`);
    }

    // model3.jsonのパスを決定する。
    // ディレクトリ名とmodel3.jsonの名前を一致させておくこと。
    const modelPath: string = path + '/';
    let modelJsonName: string = model + '.model3.json';

    this._model = new LAppModel(this._delegate, this._api);
    this._model.loadAssets(modelPath, modelJsonName);
  }

  public setViewMatrix(m: CubismMatrix44) {
    for (let i = 0; i < 16; i++) {
      this._viewMatrix.getArray()[i] = m.getArray()[i];
    }
  }

  public setX(x: number) {
    this._x = x;
  }

  public setY(y: number) {
    this._y = y;
  }

  public setOnTap(call) {
    this._onTap = call;
  }

  /**
   * コンストラクタ
   */
  constructor(delegate: LAppDelegate, api: Live2dAPI) {
    this._delegate = delegate;
    this._api = api;
    this._viewMatrix = new CubismMatrix44();
    this.changeScene();
    this._scale = 1.0;
    this._x = 0.0;
    this._y = 0.0;
  }

  _onTap: any;
  _scale: number;
  _x: number;
  _y: number;
  _api: Live2dAPI;
  _delegate: LAppDelegate;
  _viewMatrix: CubismMatrix44; // モデル描画に用いるview行列
  _model: LAppModel; // モデルインスタンスのコンテナ
  // モーション再生終了のコールバック関数
  _finishedMotion = (self: ACubismMotion): void => {
    LAppPal.printMessage('Motion Finished:');
    console.log(self);
  };
}
