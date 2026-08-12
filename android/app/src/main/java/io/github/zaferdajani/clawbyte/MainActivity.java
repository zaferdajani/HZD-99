package io.github.zaferdajani.clawbyte;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // THE SOUND STARTS WITH THE PICTURE. On the web this is impossible: no
    // browser will play audio nobody asked for, which is why the game has a
    // "tap for sound" badge and spends the first tap unlocking the score
    // instead of skipping a shot. Inside the app that policy is ours to set,
    // and we set it off — the opening film and its score simply begin.
    getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);

    // no sleeping mid-boss
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    goImmersive();
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus) goImmersive();
  }

  // Edge to edge, bars hidden, and they come back on a swipe rather than on a
  // stray thumb — the touch controls live in the gutters, which is exactly
  // where a system bar would otherwise sit.
  private void goImmersive() {
    View d = getWindow().getDecorView();
    d.setSystemUiVisibility(
        View.SYSTEM_UI_FLAG_LAYOUT_STABLE
      | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
      | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
      | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
      | View.SYSTEM_UI_FLAG_FULLSCREEN
      | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      getWindow().getAttributes().layoutInDisplayCutoutMode =
        WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
    }
  }
}
