// Can't use imports because the commonjs modules somehow conflict with
// tsc building the project. So we use require instead.
const fs = require("fs");
const path = require("path");

const distDir = "dist";

const serviceDir = "src/services";
const globalDir = "views";
const destViews = "dist/views";
const destAssets = "dist/assets";

if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

if (!fs.existsSync(destViews)) {
    fs.mkdirSync(destViews);
}
if (!fs.existsSync(destAssets)) {
    fs.mkdirSync(destAssets);
}

copyStaticFiles(globalDir, destViews);
copyStaticFiles(path.join(globalDir, "assets"), destAssets);

const services = fs.readdirSync(serviceDir);
for (const service of services) {
    const serviceName = service.toLowerCase();
    const serviceViews = path.join(serviceDir, serviceName, "views");
    const serviceAssets = path.join(serviceViews, "assets");
    const serviceViewsDest = path.join(destViews, serviceName);
    const serviceAssetsDest = path.join(destAssets, serviceName);
    // A little duplication will happen here, but it's not a big deal... yet.
    copyStaticFiles(serviceViews, serviceViewsDest);
    copyStaticFiles(serviceAssets, serviceAssetsDest);
}

function copyStaticFiles(srcPath, destPath) {
    // first, delete what's there
    if (fs.existsSync(destPath)) {
        const items = fs.readdirSync(destPath);
        for (const item of items) {
            const itemPath = path.join(destPath, item);
            const stats = fs.statSync(itemPath);

            if (stats.isDirectory()) {
                fs.rmdirSync(itemPath, { recursive: true });
            } else {
                fs.unlinkSync(itemPath);
            }
        }
    }
    if (!fs.existsSync(srcPath)) {
        return;
    }

    if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath);
    }

    const items = fs.readdirSync(srcPath);

    for (const item of items) {
        const itemPath = path.join(srcPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
            const newDestPath = path.join(destPath, item);
            copyStaticFiles(itemPath, newDestPath);
        } else {
            const destFilePath = path.join(destPath, item);
            fs.copyFileSync(itemPath, destFilePath);
        }
    }
}
