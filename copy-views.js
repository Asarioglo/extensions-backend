// Can't use imports because the commonjs modules somehow conflict with
// tsc building the project. So we use require instead.
const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const rimraf = require("rimraf");

const srcServicesRoot = "src/services";
const srcViewsRoot = "views";

const distDir = "dist";
const destViews = `${distDir}/views`;
const destAssets = `${distDir}/assets`;

console.log("Deleting dest directory...");
rimraf.sync(distDir);

console.log("Copying global views...");
copyStaticFiles(srcViewsRoot, destViews);
console.log("Copying global assets...");
copyStaticFiles(path.join(srcViewsRoot, "assets"), destAssets);

const services = fs.readdirSync(srcServicesRoot);
for (const serviceDir of services) {
    const serviceName = serviceDir.toLowerCase();
    const serviceViews = path.join(srcServicesRoot, serviceName, "views");
    const serviceAssets = path.join(serviceViews, "assets");
    const serviceViewsDest = path.join(destViews, serviceName);
    const serviceAssetsDest = path.join(destAssets, serviceName);
    // A little duplication will happen here, but it's not a big deal... yet.
    console.log(`Copying ${serviceName} views...`);
    copyStaticFiles(serviceViews, serviceViewsDest);
    console.log(`Copying ${serviceName} assets...`);
    copyStaticFiles(serviceAssets, serviceAssetsDest);
}

function copyStaticFiles(srcPath, destPath) {
    if (!fs.existsSync(srcPath)) {
        return;
    }

    mkdirp.mkdirpSync(destPath, { recursive: true });

    const itemsToCopy = fs.readdirSync(srcPath);

    for (const item of itemsToCopy) {
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
