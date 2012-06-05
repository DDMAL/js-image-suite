//Default threshold before user input
var defThresh = 127;
//Maximum value for greyness
var G = 255;
//Scale values for grayscaling RGB (taken from http://www.mathworks.com/help/toolbox/images/ref/rgb2gray.html )
var rScale = 0.2989;
var gScale = 0.5870;
var bScale = 0.1140;
var widthLim = 750;
var heightLim = 750;
var imageObj;
var globalThresh = 0;

//Setup
window.onload = function() {
    imageObj = new Image();
    //Calculate initial threshold with the Brink formula and draw binarized image
    imageObj.onload = initImage;
    
    //Image path (TO BE REPLACED LATER)
    imageObj.src = "/static/images/ISHAM_3558.15.39_0068.png";
    //imageObj.src = imageScale(imageObj);
    
    //jQuery slider definition for threshold controller
    $("#slider").slider({
                        animate: true,
                        min: 0,
                        max: G,
                        orientation: "horizontal",
                        step: 1,
                        value: defThresh,
                        range: false,
                        slide: function(event, ui) {binarize(ui.value)},
                        });
    
    $("#threshsend").click(function () {
                           $.ajax({
                                  type: "POST",
                                  data: {
                                            img_url:      imageObj.src.replace("http://localhost:8888", "."),
                                            thresh_value: globalThresh
                                        },
                                  url: "/binarize/simplethreshold"
                                  });
                           });
};

initImage = function() {
    //Adjust size of canvas to fit image
    $("#imview").attr("width", imageObj.width);
    $("#imview").attr("height", imageObj.height);
    $("#imorig").attr("width", imageObj.width);
    $("#imorig").attr("height", imageObj.height);
    if (imageObj.width > widthLim || imageObj.height > heightLim) {
        var canvasA = document.getElementById("imview");
        var contextA = canvasA.getContext("2d");
        var canvasB = document.getElementById("imorig");
        var contextB = canvasB.getContext("2d");
        var scaleValA = 0;
        var scaleValB = 0;
        scaleValA = widthLim / imageObj.width;
        scaleValB = heightLim / imageObj.height;
        var scaleVal = Math.min(scaleValA, scaleValB);
        canvasA.width = canvasA.width * scaleVal;
        canvasA.height = canvasA.height * scaleVal;
        canvasB.width = canvasB.width * scaleVal;
        canvasB.height = canvasB.height * scaleVal;
        imageObj.height *= scaleVal;
        imageObj.width *= scaleVal;
        contextA.scale(scaleVal, scaleVal);
        contextB.scale(scaleVal, scaleVal);
        contextB.drawImage(imageObj, 0, 0);
    }
    var pmf = genPMF(imageObj);
    defThresh = threshBrink(pmf);
    binarize(defThresh);

    //Manually set inital value for slider
    $("#slider").slider("value", defThresh);
    $("#slider").width(imageObj.width * 2);
}

//Binarizes data, splitting foreground and background at a given brightness level
binarize = function(thresh) {
    var canvas = document.getElementById("imview");
    var context = canvas.getContext("2d");
    $("#threshsend").attr("value", thresh);
    globalThresh = thresh;
    //Have to redraw image and then scrape data
    context.drawImage(imageObj, 0, 0);
    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    for (var i = 0; i < data.length; i +=4) {
        //Brightness is the greyscale value for the given pixel
        var brightness = rScale * data[i] + gScale * data[i + 1] + bScale * data[i + 2];
        
        // Binarize image (set to black or white)
        if (brightness > thresh) {
            data[i] = G;
            data[i + 1] = G;
            data[i + 2] = G;
        } else {
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
        }
    }
    //Draw binarized image
    context.putImageData(imageData, 0, 0);
}

// Generates a PMF (Probability Mass Function) for the given image
genPMF = function(imageObj) {
    var canvas = document
    var canvas = document.getElementById("imview");
    var context = canvas.getContext("2d");
    
    //Have to redraw image and then scrape data
    context.drawImage(imageObj, 0, 0);
    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    var pmf = new Array(G + 1);
    for (var i = 0; i < pmf.length; i++)
        pmf[i] = 0;
    for (var i = 0; i < data.length; i +=4) {
        //Brightness is the greyscale value for the given pixel
        var brightness = rScale * data[i] + gScale * data[i + 1] + bScale * data[i + 2];
        pmf[Math.round(brightness)]++;
    }
    // Normalize PMF values to total 1
    for (var i = 0; i < pmf.length; i++)
        pmf[i] /= (data.length / 4);
    return pmf;
}

//Mean of foreground (darker than threshold) levels
meanForeground = function(T, pmf) {
    mF = 0;
    for (var g = 0; g <= T; g++)
        mF += (g * pmf[g]);
    return mF;
}

//Mean of background (lighter than threshold) levels
meanBackground = function(T, pmf) {
    mB = 0;
    for (var g = T + 1; g <= G; g++)
        mB += (g * pmf[g]);
    return mB;
}

//OLD Brink thresholding function
threshBrinkOld = function(pmf) {
    //Initial minVal to be reset in first iteration
    var minVal = -1;
    //Minimum-valued threshold encountered
    var minT = 0;
    
    //Take argmin{H(T)}
    for (var T = 0; T <= G; T++) {
        var lSum = 0;
        for (var g = 1; g <= T; g++) {
            mF = meanForeground(T, pmf);
            var llog = mF * Math.log(mF / g);
            var rlog = g * Math.log(g / mF);
            lSum += (pmf[g] * (llog + rlog));
        }
        var rSum = 0;
        for (var g = T + 1; g <= G; g++) {
            mB = meanBackground(T, pmf);
            var llog = mB * Math.log(mB / g);
            var rlog = g * Math.log(g / mB);
            rSum += (pmf[g] * (llog + rlog));
        }
        var total = lSum + rSum;
        if (total < minVal || minVal < 0) {
            minVal = total;
            minT = T;
        }
    }
    return minT;
}

//Johanna's Brnk Thresholding function
threshBrink = function(pmf) {
    var Topt = 0;       // threshold value
    var locMin;         // local minimum
    var isMinInit = 0;  // flat for minimum initialization
    
    var mF = new Array(256);        // first foreground moment
    var mB = new Array(256);        // first background moment
    
    var tmpVec1 = new Array(256);   // temporary vector 1
    var tmpVec2 = new Array(256);   // temporary vector 2
    var tmpVec3 = new Array(256);   // temporary vector 3
    
    var tmp1 = new Array(256);      // temporary matrix 1
    var tmp2 = new Array(256);      // temporary matrix 2
    var tmp3 = new Array(256);      // temporary matrix 3
    var tmp4 = new Array(256);      // temporary matrix 4
    
    var tmpMat1 = new Array(256);   // local temporary matrix 1
    var tmpMat2 = new Array(256);   // local temporary matrix 2
    
    //2-dimensionalize matrices
    for (var i = 0; i < 256; i++) {
        tmp1[i] = new Array(256);
        tmp2[i] = new Array(256);
        tmp3[i] = new Array(256);
        tmp4[i] = new Array(256);
        
        tmpMat1[i] = new Array(256);
        tmpMat2[i] = new Array(256);
    }
    
    // compute foreground moment
    mF[0] = 0.0;
    for (var i = 1; i < 256; i++)
        mF[i] = i * pmf[i] + mF[i - 1];
    
    // compute background moment
    mB = mF.slice(0);
    
    for (var i = 0; i < 256; i++)
        mB[i] = mF[255] - mB[i];
    
    // compute brink entropy binarization
    for (var i = 0; i < 256; i++) {
        for (var j = 0; j < 256; j++) {
            tmp1[i][j] = mF[j] / i;
            if ((mF[j] == 0) || (i == 0)) {
                tmp2[i][j] = 0.0;
                tmp3[i][j] = 0.0;
            } else {
                tmp2[i][j] = Math.log(tmp1[i][j]);
                tmp3[i][j] = Math.log(1.0 / tmp1[i][j]);
            }
            tmp4[i][j] = pmf[i] * (mF[j] * tmp2[i][j] + i * tmp3[i][j]);
        }
    }
    
    // compute the diagonal of the cumulative sum of tmp4 and store result in tmpVec1
    tmpMat1[0] = tmp4[0].slice(0);      // copies first row of tmp4 to the first row of tmpMat1
    for (var i = 1; i < 256; i++)       // get cumulative sum
        for (var j = 0; j < 256; j++)
            tmpMat1[i][j] = tmpMat1[i - 1][j] + tmp4[i][j];
    for (var i = 0; i < 256; i++)       // set to diagonal
        tmpVec1[i] = tmpMat1[i][i];     // tmpVec1 is now the diagonal of the cumulative sum of tmp4
    
    
    // same operation but for background moment, NOTE: tmp1 through tmp4 get overwritten
    for (var i = 0; i < 256; i++) {
        for (var j = 0; j < 256; j++) {
            tmp1[i][j] = mB[j] / i;     // tmpb0 = m_b_rep ./ g_rep;
            if ((mB[j] == 0) || (i == 0)) {
                tmp2[i][j] = 0.0;       // replace inf or NaN values with 0
                tmp3[i][j] = 0.0;
            } else {
                tmp2[i][j] = Math.log(tmp1[i][j]);
                tmp3[i][j] = Math.log(1.0 / tmp1[i][j]);
            }
            tmp4[i][j] = pmf[i] * (mB[j] * tmp2[i][j] + i * tmp3[i][j]);
        }
    }
    
    // sum columns, subtract diagonal of cumulative sum of tmp4 
    tmpVec2 = tmp4[0].slice(0);         // copies first row of tmp4 to the first row of tmpMat2	
    for (var i = 0; i < 256; i++)
        for (var j = 0; j < 256; j++)
            tmpVec2[j] += tmp4[i][j];   // sums of columns of tmp4 and store result in tmpVec2
    
    // compute the diagonal of the cumulative sum of tmp4 and store result in tmpVec1
    tmpMat2[0] = tmp4[0].slice(0);      // copies first row of tmp4 to the first row of tmpMat2	
    for (var i = 1; i < 256; i++)       // get cumulative sum
        for (var j = 0; j < 256; j++)
            tmpMat2[i][j] = tmpMat2[i - 1][j] + tmp4[i][j];
    for (var i = 0; i < 256; i++)       // set to diagonal
        tmpVec3[i] = tmpMat2[i][i];     // tmpVec3 is now the diagonal of the cumulative sum of tmpMat2
    
    for (var i = 0; i < 256; i++)
        tmpVec2[i] -= tmpVec3[i];
    for (var i = 0; i < 256; i++)
        tmpVec1[i] += tmpVec2[i];
    
    // calculate the threshold value
    for (var i = 0; i < 256; i++) {
        if (mF[i] != 0 && mB[i] != 0) {
            if ((isMinInit == 0) || (tmpVec1[i] < locMin)) {
                isMinInit = 1;
                locMin = tmpVec1[i];    // gets a new minimum
                Topt = i;
            }
        }
    }
    
    // return optimal threshold
    return Topt;
}


readIMG = function(input) {
    if (window.FileReader) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            imageObj = new Image();
            imageObj.onload = initImage;
            reader.onload = function (e) {
                imageObj.src = e.target.result;
                $("#img_url").attr("value", e.target.result);
                
            }
            reader.readAsDataURL(input.files[0]);
        }
    } else {
        alert ("FileReader is not supported by this browser.");
    }
}