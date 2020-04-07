package com.rna.bootsplash;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.ReactActivity;
import com.rna.core.RNKPackageInterface;
import com.rna.core.RNKRegistry;
import java.util.Arrays; 
import java.util.Collections;
import java.util.List;
import com.zoontek.rnbootsplash.RNBootSplash; // <- add this necessary import
public class RNKBootSplashPackage implements ReactPackage, RNKPackageInterface {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Collections.emptyList(); 
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
    @Override
    public void createEventManagers(RNKRegistry registry) {
        registry.add("activity.create", "bootsplash", (Object o) -> {
            ReactActivity a = (ReactActivity) o;
            int id = a.getResources().getIdentifier("bootsplash", "drawable",a.getPackageName());
            RNBootSplash.init(id, a); // <- display the generated bootsplash.xml drawable over our MainActivity
            return true;
        });
    }

}