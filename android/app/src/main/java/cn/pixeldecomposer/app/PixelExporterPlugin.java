package cn.pixeldecomposer.app;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import androidx.annotation.NonNull;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

@CapacitorPlugin(
    name = "PixelExporter",
    permissions = {
        @Permission(alias = "legacyStorage", strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE })
    }
)
public class PixelExporterPlugin extends Plugin {
    private static final String APP_FOLDER = "Pixel Decomposer";

    @PluginMethod
    public void exitApp(PluginCall call) {
        call.resolve();
        getActivity().runOnUiThread(() -> getActivity().finish());
    }

    @PluginMethod
    public void saveFile(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q && getPermissionState("legacyStorage") != PermissionState.GRANTED) {
            requestPermissionForAlias("legacyStorage", call, "saveAfterPermission");
            return;
        }
        writeFile(call);
    }

    @PermissionCallback
    public void saveAfterPermission(PluginCall call) {
        if (getPermissionState("legacyStorage") != PermissionState.GRANTED) {
            call.reject("需要存储权限才能保存文件。");
            return;
        }
        writeFile(call);
    }

    private void writeFile(@NonNull PluginCall call) {
        String data = call.getString("data");
        if (data == null || data.isEmpty()) {
            call.reject("没有可保存的数据。");
            return;
        }

        String mimeType = call.getString("mimeType", "application/octet-stream");
        String filename = safeFilename(call.getString("filename", "pixel-decomposer-export"));
        boolean isImage = mimeType.startsWith("image/");

        try {
            byte[] bytes = Base64.decode(data, Base64.DEFAULT);
            Uri savedUri = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
                ? writeWithMediaStore(bytes, filename, mimeType, isImage)
                : writeLegacy(bytes, filename, mimeType, isImage);
            JSObject result = new JSObject();
            result.put("uri", savedUri.toString());
            result.put("destination", isImage ? "gallery" : "downloads");
            call.resolve(result);
        } catch (IllegalArgumentException exception) {
            call.reject("导出数据格式无效。", exception);
        } catch (IOException exception) {
            call.reject("文件无法保存到设备。", exception);
        }
    }

    private Uri writeWithMediaStore(byte[] bytes, String filename, String mimeType, boolean isImage) throws IOException {
        ContentValues values = new ContentValues();
        values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
        values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
        values.put(MediaStore.MediaColumns.RELATIVE_PATH, (isImage ? Environment.DIRECTORY_PICTURES : Environment.DIRECTORY_DOWNLOADS) + "/" + APP_FOLDER);
        values.put(MediaStore.MediaColumns.IS_PENDING, 1);

        ContentResolver resolver = getContext().getContentResolver();
        Uri collection = isImage ? MediaStore.Images.Media.EXTERNAL_CONTENT_URI : MediaStore.Downloads.EXTERNAL_CONTENT_URI;
        Uri uri = resolver.insert(collection, values);
        if (uri == null) throw new IOException("无法创建导出文件。");

        try (OutputStream output = resolver.openOutputStream(uri)) {
            if (output == null) throw new IOException("无法打开导出文件。");
            output.write(bytes);
        } catch (IOException exception) {
            resolver.delete(uri, null, null);
            throw exception;
        }

        ContentValues completed = new ContentValues();
        completed.put(MediaStore.MediaColumns.IS_PENDING, 0);
        resolver.update(uri, completed, null, null);
        return uri;
    }

    private Uri writeLegacy(byte[] bytes, String filename, String mimeType, boolean isImage) throws IOException {
        File root = Environment.getExternalStoragePublicDirectory(isImage ? Environment.DIRECTORY_PICTURES : Environment.DIRECTORY_DOWNLOADS);
        File folder = new File(root, APP_FOLDER);
        if (!folder.exists() && !folder.mkdirs()) throw new IOException("无法创建导出目录。");
        File output = new File(folder, filename);
        try (FileOutputStream stream = new FileOutputStream(output)) {
            stream.write(bytes);
        }
        MediaScannerConnection.scanFile(getContext(), new String[] { output.getAbsolutePath() }, new String[] { mimeType }, null);
        return Uri.fromFile(output);
    }

    private String safeFilename(String filename) {
        String cleaned = filename.replaceAll("[\\\\/:*?\"<>|]", "_").trim();
        return cleaned.isEmpty() ? "pixel-decomposer-export" : cleaned;
    }
}
