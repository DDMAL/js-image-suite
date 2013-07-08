/**
 * This contains a collection of geometrical functions intended to help Kinetic.
 */
var _getDistanceToLine = function(aLinePointA, aLinePointB, aPoint) {
    if(aLinePointA.x == aLinePointB.x) {
        return Math.abs(aLinePointA.y - aLinePointB.y);
    }
    var slope = (aLinePointA.y - aLinePointB.y) / (aLinePointA.x - aLinePointB.x);
    var xIntercept = aLinePointA.y - (slope * aLinePointA.x);
    var distance = ((slope * aPoint.x) - aPoint.y + xIntercept) / Math.sqrt((slope * slope) + 1);
    return Math.abs(distance);
};

var _getOrthogonalIntersectOfPointToLine = function(aLinePointA, aLinePointB, aPoint) {
    if(aLinePointA.x == aLinePointB.x) {
        return {x: aLinePointA.x, y: aPoint.y};
    }
    var slope = (aLinePointA.y - aLinePointB.y) / (aLinePointA.x - aLinePointB.x);
    var xIntercept = aLinePointA.y - (slope * aLinePointA.x);
    var orthogonalSlope = -1 / slope;
    var orthogonalXIntercept = aPoint.y - (orthogonalSlope * aPoint.x);
    var interceptionX = (orthogonalXIntercept - xIntercept) / (slope - orthogonalSlope);
    var interceptionY = (slope * interceptionX) + xIntercept;
    return {x: interceptionX, y: interceptionY};
};

var _isIntegerBetweenOthers = function(aInt0, aInt1, aTest) {
    if ((aInt0 <= aInt1 && aInt0 <= aTest && aTest<= aInt1) || (aInt0 >= aInt1 && aInt0 >= aTest && aTest>= aInt1)) {
        return true;
    }
    return false;
};

var _getClosestPoint = function(aPointA, aPointB, aOriginPoint) {
    var distanceASquared = Math.pow(aPointA.x - aOriginPoint.x, 2) + Math.pow(aPointA.y - aOriginPoint.y, 2);
    var distanceBSquared = Math.pow(aPointB.x - aOriginPoint.x, 2) + Math.pow(aPointB.y - aOriginPoint.y, 2);
    if (distanceASquared <= distanceBSquared) {
        return aPointA;
    }
    return aPointB;
};

var _getDistanceToPoint = function(aPointA, aPointB) {
    var distanceSquared = Math.pow(aPointA.x - aPointB.x, 2) + Math.pow(aPointA.y - aPointB.y, 2);
    return Math.sqrt(distanceSquared);
};

var _isPointInLineSegmentPlane = function(aLinePointA, aLinePointB, aPoint) {
    var result = {isInPlane: false, distanceToPlane: -1, distanceToLineSegment: -1};
    var orthogonalLineIntersectionOfPointToLine = _getOrthogonalIntersectOfPointToLine(aLinePointA, aLinePointB, aPoint);
    result.isInPlane = _isIntegerBetweenOthers(aLinePointA.x, aLinePointB.x, orthogonalLineIntersectionOfPointToLine.x);
    if (result.isInPlane) {
        result.distanceToLineSegment = _getDistanceToLine(aLinePointA, aLinePointB, aPoint);
        result.distanceToPlane = 0;
    }
    else {
        var closestPoint = _getClosestPoint(aLinePointA, aLinePointB, aPoint);
        result.distanceToPlane = _getDistanceToPoint(closestPoint, orthogonalLineIntersectionOfPointToLine);
        result.distanceToLineSegment = _getDistanceToPoint(closestPoint, aPoint);
    }
    return result;
};

/**
 * Given a group and a point, returns the indecies that should neighbour the new anchor.
 * This is meant for a hit outside of the polygon.
 */
var _getIndeiesOfNeighbourAnchorsForNewAnchorOutside = function(aGroupAnchors, aPoint)
{
    var numberOfPoints = aGroupAnchors.length;
    var resultArray = [];
    var bestIndex = -1;
    for (var i = 0; i < numberOfPoints; i++) {

        // Get points of line segment (note: we set y to neg. so as to resemble pure Cart. coords.)
        var nextIndex = (i + 1) % numberOfPoints;
        var pointA = aGroupAnchors[i].getAbsolutePosition();
        var pointB = aGroupAnchors[nextIndex].getAbsolutePosition();
        pointA.y *= -1;
        pointB.y *= -1;

        // Determine if the point is in the line segment plane.
        resultArray[i] = _isPointInLineSegmentPlane(pointA, pointB, aPoint);

        // If this is the first, mark it.  Else, figure out if this line segment is the new best.
        var bestResult = resultArray[bestIndex];
        var currentResult = resultArray[i];
        if (bestIndex < 0) {
            bestIndex = i;
        }
        else if (Math.round(bestResult.distanceToLineSegment) == Math.round(currentResult.distanceToLineSegment)) {
            bestIndex = bestResult.distanceToPlane <= currentResult.distanceToPlane ? bestIndex : i;
        } else if (bestResult.isInPlane && currentResult.isInPlane) {
            bestIndex = bestResult.distanceToLineSegment <= currentResult.distanceToLineSegment ? bestIndex : i;
        }
        else {
            bestIndex = bestResult.distanceToLineSegment <= currentResult.distanceToLineSegment ? bestIndex : i;
        }
    }
    return [bestIndex, (bestIndex + 1) % numberOfPoints];
};