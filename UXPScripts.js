

const { app, core, action, constants } = require('photoshop');
const { ElementPlacement, BlendMode } = require('photoshop').constants;
let anchorPos = require('photoshop').constants.AnchorPosition
const doc = app.activeDocument;
//=======================Prototye Extend==============================\\
require('photoshop').app.Document.prototype.collectAllPixelLayers = function () {
    let allPixelLayers = new Array;
    function dequy(parent, array) {
        for (var i = 0; i < parent.layers.length; i++) {
            var lyr = parent.layers[i];
            if (lyr.kind != "group") {
                array.push(lyr)
            } else {
                dequy(lyr, array)
            }
        }
    }
    dequy(this, allPixelLayers)
    return allPixelLayers
};
require('photoshop').app.Layer.prototype.Blur = async function (rds) {
    await action.batchPlay(
        [
            {
                _obj: "gaussianBlur",
                radius: {
                    _unit: "pixelsUnit",
                    _value: rds
                },
                _options: {
                    dialogOptions: "display"
                }
            }

        ], {
        "synchronousExecution": true,
        "modalBehavior": "execute"
    }
    );
    return 'a'
};
require('photoshop').app.Layer.prototype.ApplyImage = async function (layers) {
    if (doc.bitsPerChannel == 'bitDepth16') {
        await action.batchPlay(
            [
                {
                    "_obj": "applyImageEvent",
                    "with": {
                        "_obj": "calculation",
                        "calculation": {
                            "_enum": "calculationType",
                            "_value": "add"
                        },
                        "invert": true,
                        "offset": 0,
                        "scale": 2.0,
                        "to": {
                            "_ref": [
                                { "_enum": "channel", "_ref": "channel", "_value": "RGB" },
                                { "_id": layers, "_ref": "layer" }
                            ]
                        }
                    }
                }
            ],
            { "synchronousExecution": true, "modalBehavior": "execute" }
        );
    } else {
        await action.batchPlay(
            [
                {
                    "_obj": "applyImageEvent",
                    "with": {
                        "_obj": "calculation",
                        "calculation": {
                            "_enum": "calculationType",
                            "_value": "subtract"
                        },
                        "offset": 128,
                        "scale": 2.0,
                        "to": {
                            "_ref": [
                                { "_enum": "channel", "_ref": "channel", "_value": "RGB" },
                                { "_id": layers, "_ref": "layer" }
                            ]
                        }
                    }
                }
            ],
            { "synchronousExecution": true, "modalBehavior": "execute" }
        );
    };
};
require('photoshop').app.Layer.prototype.Median = async function (rds) {
    await action.batchPlay(
        [
            {
                _obj: "median",
                radius: {
                    _unit: "pixelsUnit",
                    _value: rds
                },
                _options: {
                    dialogOptions: "display"
                }
            }
        ], {
        "synchronousExecution": true,
        "modalBehavior": "execute"
    }
    );
};
async function confirm(message) {
    let dialog = createConfirmDialog(message);
    document.body.appendChild(dialog).showModal();
    return new Promise((resolve, reject) => {
        try {
            const yesBtn = document.getElementById("yes");
            yesBtn.addEventListener("click", () => {
                dialog.close();
                resolve(true); // Trả về true khi người dùng xác nhận "Yes"
            });

            // Khi người dùng nhấn "No"
            const noBtn = document.getElementById("no");
            noBtn.addEventListener("click", () => {
                dialog.close();
                resolve(false); // Trả về false khi người dùng chọn "No"
            });

            dialog.addEventListener("cancel", () => {
                reject("dialog cancelled");
            });
            dialog.addEventListener("close", () => {
                reject("dialog closed");
            });
        } catch (e) {
            console.log(e);
            reject(e);
        }
    });
    function createConfirmDialog(message) {
        // Tạo hộp thoại
        const dialog = document.createElement("dialog");
        dialog.style.color = "white";
        dialog.style.backgroundColor = "#333";
        dialog.style.padding = "20px";
        dialog.style.borderRadius = "8px";
        dialog.style.width = "400px";
        dialog.style.textAlign = "center";

        // Tạo tiêu đề
        const header = document.createElement("h2");
        header.textContent = "Xác nhận";
        header.style.color = "white";
        dialog.appendChild(header);

        // Tạo  nội dung thông báo
        const messageParagraph = document.createElement("p");
        messageParagraph.textContent = message;
        messageParagraph.style.color = "#ddd";
        messageParagraph.style.marginBottom = "20px";
        dialog.appendChild(messageParagraph);

        // Tạo nút Yes
        const yesButton = document.createElement("button");
        yesButton.id = "yes";
        yesButton.textContent = "Yes";
        yesButton.style.padding = "10px 20px";
        yesButton.style.marginRight = "10px";
        yesButton.style.backgroundColor = "#008CBA";
        yesButton.style.color = "#fff";
        yesButton.style.border = "none";
        yesButton.style.borderRadius = "5px";
        yesButton.style.cursor = "pointer";
        dialog.appendChild(yesButton);

        // Tạo nút No
        const noButton = document.createElement("button");
        noButton.id = "no";
        noButton.textContent = "No";
        noButton.style.padding = "10px 20px";
        noButton.style.backgroundColor = "#f44336";
        noButton.style.color = "#fff";
        noButton.style.border = "none";
        noButton.style.borderRadius = "5px";
        noButton.style.cursor = "pointer";
        dialog.appendChild(noButton);

        return dialog;
    }
};
function getVariant() {
    let name = doc.activeLayers[0];
    let namedex, index, variants
    if (name) {
        namedex = doc.activeLayers[0].parent;
    };
    if (namedex) {
        index = namedex.name.slice(-1);
    } else {
        index = 0
    }
    variants = doc.layers.getByName("Variant " + index);
    if ((variants === null) || (variants.allLocked)) {
        variants = doc.layers.reverse().find(variant => {
            if ((variant.name.indexOf("Variant") == 0) && (!variant.allLocked)) {
                return variant;
            }
        })
    }

    if ((variants === undefined) || (variants.kind != 'group')) return null;
    return {
        Variant: variants,
        Color: variants.layers[0],
        Item: variants.layers[1],
        Shadow: variants.layers[2],
        Background: variants.layers[3]
    }
};
async function duplicateLayer() {
    await action.batchPlay(
        [
            { "_obj": "copyToLayer" }
        ], {
        "synchronousExecution": true,
        "modalBehavior": "execute"
    }
    )
};
async function selectLayer(layerid) {
    if (typeof layerid == "number") {
        var tagets = { _ref: 'layer', _id: layerid }
    } else if (typeof layerid == "string") {
        var tagets = { _ref: 'layer', _name: layerid }
    }
    await action.batchPlay([
        {
            _obj: 'select',
            _target: [tagets]
        }
    ], { synchronousExecution: true });
    if (doc.activeLayers[0].id != layerid) { return false }
};
async function dust(rds, thrsd) {
    await action.batchPlay(
        [
            {
                "_obj": "dustAndScratches", "radius": rds, "threshold": thrsd,
                _options: {
                    dialogOptions: "display"
                }
            },

        ], {
        "synchronousExecution": true,
        "modalBehavior": "execute"
    }
    )
};
async function mergeLayers() {
    await action.batchPlay(
        [
            { "_obj": "mergeLayersNew" }
        ], {
        "synchronousExecution": true,
        "modalBehavior": "execute"
    }
    )
};
async function setBrushSource() {
    await action.batchPlay(
        [
            {
                "_obj": "set", "_target": [{ "_property": "historyBrushSource", "_ref": "historyState" }],
                "to": { "_property": "currentHistoryState", "_ref": "historyState" }
            }
        ], {
        "synchronousExecution": true,
        "modalBehavior": "execute"
    }
    )
};
async function makeSnapShot(name) {
    await action.batchPlay(
        [
            {
                _obj: "make",
                _target: [
                    {
                        _ref: "snapshotClass"
                    }
                ],
                from: {
                    _ref: "historyState",
                    _property: "currentHistoryState"
                },
                name: name,
                using: {
                    _enum: "historyState",
                    _value: "fullDocument"
                },
                replaceExisting: true,
                _options: {
                    dialogOptions: "dontDisplay"
                }
            }
        ], {
        "synchronousExecution": true,
        "modalBehavior": "execute"
    }
    )
}
async function preHistory() {
    await action.batchPlay(
        [
            {
                "_obj": "select",
                "_target": [{ "_enum": "ordinal", "_ref": "historyState", "_value": "previous" }]
            }
        ], {
        "synchronousExecution": true,
        "modalBehavior": "execute"
    }
    )
};
async function mergeVisible() {
    await action.batchPlay(
        [
            {
                _obj: "make",
                _target: [
                    {
                        _ref: "layer"
                    }
                ]
            },
            {
                "_obj": "mergeVisible",
                "duplicate": true,
            }
        ], {
        "synchronousExecution": true,
        "modalBehavior": "execute"
    }
    )
};
async function selectTool(Tool) {
    await action.batchPlay(
        [
            {
                _obj: "select",
                _target: [
                    {
                        _ref: Tool
                    }
                ],
                _options: {
                    dialogOptions: "dontDisplay"
                }
            }
        ],
        {}
    )
};
async function collectAllLayers(Parent, Array) {
    for (var i = Parent.layers.length - 1; i >= 0; i--) {
        var lys = Parent.layers[i];
        if (lys.kind != 'group') {
            Array.push(lys)
        } else {
            collectAllLayers(lys, Array)
        }
    }
};
async function mergeLayersForIndex(lyr) {
    let allLayers = [];
    let layerUnVisible = [];
    collectAllLayers(doc, allLayers);
    for (var i = 0; i < allLayers.length; i++) {
        if (allLayers[i].id == lyr.id) {
            var index = i + 1;
            break;
        };
    };
    for (var i = index; i < allLayers.length; i++) {
        if (allLayers[i].visible) {
            allLayers[i].visible = false;
            layerUnVisible.push(allLayers[i]);
        }
    };
    mergeVisible();
    layerUnVisible.forEach(lys => {
        lys.visible = true;
    })
};
async function dustAndScratches(rds, thrs) {
    if (getVariant() != null) {
        const Variant = getVariant().Variant;
        var grColor = Variant.layers[0];
        var grItem = Variant.layers[1];
        var grShadow = Variant.layers[2];
        var grBackground = Variant.layers[3];
        var Product = grItem.layers.reverse().find(lys => {
            if ((lys.name.indexOf("Product") == 0) && (!lys.allLocked)) {
                return lys;
            };
        });
        var layerRt = grItem.layers.find(lys => {
            if ((!lys.allLocked) && (lys.visible)) return lys;
        });
    } else {
        if ((doc.activeLayers[0].kind != 'pixel') || (doc.activeLayers[0].allLocked) || (!doc.activeLayers[0].visible)) {
            var layerRt = doc.layers.find(lys => {
                if ((lys.name.indexOf("Stencil") == -1) && (!lys.allLocked) && (lys.visible) && (lys.kind == 'pixel')) {
                    return lys;
                };
            });
        } else {
            var layerRt = doc.activeLayers[0];
        };
    };
    makeSnapShot('Return');
    selectLayer(layerRt.id);
    mergeLayersForIndex(doc.activeLayers[0]);
    dust(rds, thrs);
    mergeLayers();
    setBrushSource();
    preHistory();
    doc.activeLayers[0].delete();
    selectLayer(layerRt.id);
    core.executeAsModal(async () => {
        await selectTool("historyBrushTool");
    });
};
async function frequencySeparation() {
    let layerRt, grColor, grItem, grShadow, grBackground, Product, Variant
    if (getVariant() != null) {
        Variant = getVariant().Variant;
        grColor = Variant.layers[0]
        grItem = Variant.layers[1]
        grShadow = Variant.layers[2]
        grBackground = Variant.layers[3]
        Product = grItem.layers.reverse().find(lys => {
            if ((lys.name.indexOf("Product") == 0) && (!lys.allLocked)) {
                return lys;
            }
        })
        layerRt = grItem.layers.find(lys => {
            if ((!lys.allLocked) && (lys.visible)) return lys
        })
    } else {
        if (!doc.activeLayers[0]) {
            layerRt = doc.layers[0];
        } else if ((doc.activeLayers[0].kind != 'pixel') || (doc.activeLayers[0].allLocked) || (!doc.activeLayers[0].visible)) {
            layerRt = doc.layers.find(lys => {
                if ((lys.name.indexOf("Stencil") == -1) && (!lys.allLocked) && (lys.visible) && (lys.kind == 'pixel')) {
                    return lys;
                }
            })
        } else {
            layerRt = doc.activeLayers[0];
        }
    }
    makeSnapShot('Return')
    selectLayer(layerRt.id);
    mergeLayersForIndex(doc.activeLayers[0]);
    doc.activeLayers[0].name = "Lights"
    const lysLights = doc.activeLayers[0];
    duplicateLayer();
    doc.activeLayers[0].name = "Details";
    const lysDetails = doc.activeLayers[0];
    doc.activeLayers[0].visible = false;
    selectLayer(lysLights.id);
    let tsblur = document.getElementById("blurfs").value
    const blurtype = document.getElementById("withMed").checked;
    if (blurtype) doc.activeLayers[0].Median(tsblur);
    else doc.activeLayers[0].Blur(tsblur);
    selectLayer(lysDetails.id);
    doc.activeLayers[0].ApplyImage(lysLights.id);
    doc.activeLayers[0].blendMode = BlendMode.LINEARLIGHT;
    selectLayer(lysLights.id);
    core.executeAsModal(async () => {
        await selectTool("wetBrushTool");
    });

};
async function getProperties(layer) {
    const result = await action.batchPlay(
        [
            {
                _obj: "get",
                _target: [
                    {
                        _ref: "layer",
                        _id: layer.id
                    }
                ]
            }
        ],
        {
            synchronousExecution: true,
            modalBehavior: "execute"
        }
    );
    let properti = new Array();
    properti.push(result[0].hasUserMask, result[0].hasVectorMask, result[0].userMaskEnabled, result[0].userMaskLinked)
    return {
        hasMask: properti[0],
        hasVectorMask: properti[1],
        userMask: properti[2],
        linkMask: properti[3]
    };
};
async function SsenseTop() {
    doc.selection.selectAll();
    let allGuides = doc.selection.bounds;
    const guideBottom = allGuides.bottom - (allGuides.bottom * 0.08);
    const guideTop = allGuides.bottom - (allGuides.bottom * 0.986);
    const guideLeft = allGuides.right - (allGuides.right * 0.945);
    const guideRight = (allGuides.right - (allGuides.right * 0.5));
    const lastGuide = (allGuides.right - (allGuides.right * 0.055));
    doc.selection.deselect();
    const guideReaityTop = doc.guides[0].coordinate;
    const guideReaityBottom = doc.guides[2].coordinate;
    const guideReaityLeft = doc.guides[3].coordinate;
    const guideReaityRight = doc.guides[1].coordinate;
    const A1 = guideReaityBottom - guideReaityTop;
    const Y1 = guideReaityBottom;
    const X1 = guideReaityRight;
    const Y2 = doc.layers.getByName("Resized").bounds.bottom;
    const Y3 = Y2 - Y1;
    const Y10 = guideBottom - guideTop;
    let resizePercent = ((guideBottom - guideTop) / A1) * 100;
    selectLayer(doc.layers.getByName("Resized").id);
    if (resizePercent != 100) {
        doc.activeLayers[0].scale(resizePercent, resizePercent, anchorPos.BOTTOMCENTER);
    }
    const Y4 = Y2 - ((Y3 * Y10) / A1);
    doc.activeLayers[0].translate(guideRight - X1, guideBottom - Y4);
    doc.guides.removeAll();
    doc.guides.add(constants.Direction.HORIZONTAL, guideTop);
    doc.guides.add(constants.Direction.VERTICAL, guideRight);
    doc.guides.add(constants.Direction.HORIZONTAL, guideBottom);
    doc.guides.add(constants.Direction.VERTICAL, guideLeft);
    doc.guides.add(constants.Direction.VERTICAL, lastGuide);
};
async function Ssense() {
    let lysLink = doc.layers.getByName("Resized");
    doc.layers.forEach(async lys => {
        if (lys.name.indexOf('Original') != 0) lys.link(lysLink);
    });
    if (doc.guides.length == 5) {
        SsenseTop();
    };
};
