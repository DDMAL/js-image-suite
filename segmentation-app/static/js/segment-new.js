(function ($) {
    var RKSegment = function(element, options) {
        var defaults = {
            image: null,  // the image object we're segmenting
            polyPoints: null,   // the polygon points we're applying to the image
            originalWidth: null,
            anchorSize: 7
        };

        var settings = $.extend({}, defaults, options);

        var globals = {
            kStage: null,   // kinetic stuff
            kLayer: null,
            kImage: null,
            scalingFactor: null,
            scaledMargin: null,
            marginWidth: 0.05,
            selectedPoly: null,
            unselectedColour: "blue",
            selectedColour: "red",
            selectedAnchor: null
        };
        $.extend(settings, globals);


        var self = this;  // global class reference is `self`

        var init = function () {
            $('body').keydown(function(e) {
                // handle delete events
                if (e.which === 8 || e.which === 46) {
                    e.preventDefault();
                    if (settings.selectedPoly) {
                        _deletePoly(settings.selectedPoly);
                    }
                }
            });

            var imageObj = new Image();
            imageObj.onload = function() {
                settings.scalingFactor = imageObj.width / settings.originalWidth;
                settings.scaledMargin = imageObj.width * settings.marginWidth;

                settings.kStage = new Kinetic.Stage({
                    container: settings.parentObject.getAttribute('id'),
                    width: imageObj.width,
                    height: imageObj.height,
                    margin: settings.scaledMargin
                });

                settings.kLayer = new Kinetic.Layer();

                settings.kImage = new Kinetic.Image({
                    width: imageObj.width,
                    height: imageObj.height,
                    image: imageObj
                });

                settings.kLayer.add(settings.kImage);
                settings.kStage.add(settings.kLayer);

                var i = settings.polyPoints.length;
                while (i--) {
                    var polys = [],
                        j = settings.polyPoints[i].length,
                        group = _createGroup();

                    while (j--) {
                        var x = settings.polyPoints[i][j][0] * settings.scalingFactor,
                            y = settings.polyPoints[i][j][1] * settings.scalingFactor;
                        polys.push([x, y]);
                    }

                    var layer = new Kinetic.Layer();
                    layer.add(group);
                    settings.kStage.add(layer);

                    var poly = _createPolygon(polys, group);
                    // group.add(poly);

                    layer.draw();
                }
            };

            // this triggers the image onload method.
            imageObj.src = settings.image;
        };

        init();  // call init when the object is created.

        var _dragBoundFunc = function(pos) {
            return {x: pos.x, y: pos.y};
        };

        var _anchorHandlers = function(anchor, group) {
            anchor.on("dragmove", function(event) {
                var poly = group.get(".poly")[0],
                    border = group.get(".hittest")[0],
                    anchorIdx = group.attrs.anchors.indexOf(anchor),
                    thisAnchor = group.attrs.anchors[anchorIdx],
                    polyPoint = poly.attrs.points[anchorIdx];
                    borderPoint = border.attrs.points[anchorIdx];

                // group.setDraggable(false);
                polyPoint.y = this.getY();
                borderPoint.y = this.getY();
                polyPoint.x = this.getX();
                borderPoint.x = this.getX();
                group.getLayer().draw();
            });

            anchor.on("mousedown", function(event) {
                _selectAnchor(this, event);
            });
        };

        var _createGroup = function() {
            var group = new Kinetic.Group({
                draggable: true,
                name: 'group',
                dragBoundFunc: _dragBoundFunc,
                anchors: []
            });

            group.on("mousedown", function(event) {
                var poly = group.get(".poly")[0];
                _selectPoly(poly);

                // if (event.altKey) {
                //     event.preventDefault();
                //     console.log("Adding anchor");
                //     _addAnchor(event.layerX, event.layerY, group);
                //     return false;
                // }
            }, false);

            return group;
        };

        var _createPolygon = function(polys, group) {
            var poly = new Kinetic.Polygon({
                points: polys,
                fill: settings.unselectedColour,
                stroke: 'black',
                opacity: 0.2,
                strokeWidth: 0,
                name: "poly"
            });
            group.add(poly);

            var hitTest = new Kinetic.Polygon({
                points: polys,
                stroke: 'black',
                fillEnabled: false,
                opacity: 0.2,
                strokeWidth: 4,
                name: "hittest"
            });

            hitTest.on("click", function(event) {
                console.log(event);
                _addAnchor(event.layerX, event.layerY, group);
            });
            group.add(hitTest);

            var j = 0,
                polyLength = polys.length;
            while (j < polyLength) {
                var x = polys[j][0],
                    y = polys[j][1],
                    anchor = _createAnchor(x, y);
                group.add(anchor);
                group.attrs.anchors.push(anchor);
                _anchorHandlers(anchor, group);
                ++j;
            }

            return poly;
        };

        var _createAnchor = function(x, y) {
            var anchor = new Kinetic.Circle({
                x: x,
                y: y,
                fill: "#ddd",
                strokeWidth: 2,
                radius: settings.anchorSize,
                draggable: true,
                dragBoundFunc: _dragBoundFunc
            });

            return anchor;
        };

        var _addAnchor = function(x, y, group) {
            var poly = group.get(".poly")[0],
                border = group.get(".hittest")[0],
                nearestPoint = _findNearestPoint(x, y, poly);
            var anchor = _createAnchor(x, y);
            group.add(anchor);
            group.attrs.anchors.push(anchor);
            poly.attrs.points.push({"x": x, "y": y});
            border.attrs.points.push({"x": x, "y": y});

            _anchorHandlers(anchor, group);
            group.getLayer().draw();
            // console.log("Shortest Point");
            // console.log(_findNearestPoint(x, y, poly));
            // console.log(_findNearestPoint(x, y, poly));
        };

        var _findNearestPoint = function(x, y, poly) {
            /* For this we only consider the shortest X candidate.
               Returns the index into the polygon's points where the closest point is.
             */
            var points = poly.attrs.points,
                plen = points.length,
                i = 0;

            while (i < plen) {
                var pointA, pointB;
                pointA = points[i];

                if (i === (plen - 1)) {
                    pointB = points[0]; // wrap around to the first point in the poly
                } else {
                    pointB = points[i + 1];
                }

                console.log(pointA);
                console.log(pointB);

                ++i;
            }


            var candidate = null,
                shortestDist = 100000000000,
                shortestPoint = null,
                // shortestX = 1000000000,  // initialize with absurdly large value
                // shortestY = 1000000000,
                points = poly.attrs.points,
                i = 0,
                plen = points.length;

            while (i < plen) {
                var dist = Math.pow(points[i].x - x, 2) + Math.pow(points[i].y - y, 2);
                if (dist < shortestDist) {
                    shortestDist = dist;
                    shortestPoint = i;
                }
                ++i;
            }
            return shortestPoint;
        };

        var _selectPoly = function(poly) {
            if (settings.selectedPoly !== null && settings.selectedPoly !== poly) {
                settings.selectedPoly.setFill(settings.unselectedColour);
                settings.selectedPoly.getLayer().draw();
                settings.selectedPoly = null;
            }

            settings.selectedPoly = poly;
            settings.selectedPoly.setFill(settings.selectedColour);
            settings.selectedPoly.getLayer().draw();
        };

        var _deletePoly = function(poly) {
            var group = poly.getParent(),
                layer = group.getLayer();

            layer.remove(group);
            layer.destroy();
            settings.selectedPoly = null;
        };

        var _selectAnchor = function(anchor) {
            if (settings.selectedAnchor !== null && settings.selectedAnchor !== anchor) {
                settings.selectedAnchor.setStroke("black");
                settings.selectedAnchor.getLayer().draw();
                settings.selectedAnchor = null;
            }

            settings.selectedAnchor = anchor;
            settings.selectedAnchor.setStroke(settings.selectedColour);
            settings.selectedAnchor.getLayer().draw();
        };

        // PUBLIC METHODS \\

        this.getPolyPoints = function() {
            // if the stage isn't ready, we can't get the polys
            if (settings.kStage === null) {
                return;
            }

            var staves = settings.kStage.get('.group'),
                segments = [],
                i = staves.length;

            while (i--) {
                var group = staves[i],
                    poly = group.get(".poly")[0],
                    points = poly.attrs.points,
                    numPoly = poly.attrs.points.length;

                segments[i] = [];

                for (var j = 0; j < numPoly; ++j) {
                    if (points[j] !== undefined) {
                        var point = points[j];
                        segments[i][j] = [];
                        segments[i][j][0] = Math.round((point.x + group.getX() - settings.marginWidth) / settings.scalingFactor);
                        segments[i][j][1] = Math.round((point.y + group.getY() - settings.marginWidth) / settings.scalingFactor);
                    }
                }
            }
            return segments;
        };

        this.createPolygon = function(points) {
            points = (typeof points !== "undefined") ? points : [[10, 10], [100, 10], [100, 100], [10, 100]];  // create a new polygon if points is undefined

            var group = _createGroup(),
                polygon = _createPolygon(points, group),
                layer = new Kinetic.Layer();

            group.add(polygon);
            layer.add(group);
            settings.kStage.add(layer);
            layer.draw();
        };

    };

    $.fn.segment = function(options) {
        return this.each(function () {
            var element = $(this);

            // return early if this element already has a plugin instance
            if (element.data('segment')) {
                return;
            }

            options.parentObject = element[0];

            var segment = new RKSegment(this, options);
            element.data('segment', segment);
        });
    };

})(jQuery);