#!/usr/local/bin/python

"""
    Binarization application using Tornado and Gamera
    """

import os
import tornado.httpserver
import tornado.ioloop
import tornado.web
from tornado.options import define

from PIL import Image, ImageDraw, ImageMath
import json
import gamera.core as gam
# from gamera.plugins import segmentation
from gamera.toolkits import musicstaves

define("port", default=8888, help="run on the given port", type=int)


def __create_polygon_json_dict(poly_list):
    poly_json_list = []
    for poly in poly_list:
        tlx = poly[0].vertices[0].x
        tly = poly[0].vertices[0].y
        trx = poly[0].vertices[-1].x
        _try = poly[0].vertices[-1].y

        llx = poly[-1].vertices[0].x
        lly = poly[-1].vertices[0].y
        lrx = poly[-1].vertices[-1].x
        lry = poly[-1].vertices[-1].y
        poly_json_list.append(((tlx, tly), (trx, _try), (lrx, lry), (llx, lly)))

    return poly_json_list
        # for vertice in poly[0].vertices:
        #     print vertice

        # print "Inner loop 2"
        # for vertice in poly[3].vertices:
        #     print vertice

    # for i in xrange(0, len(poly_list)):
    #     point_list = []
    #     for j in xrange(0, len(poly_list[i][0].vertices)):  # first staff line
    #         point_set = (poly_list[i][0].vertices[j].x, poly_list[i][0].vertices[j].y)
    #         point_list.append(point_set)
    #     for j in xrange(len(poly_list[i][3].vertices)-1, -1, -1):  # last staff line
    #         point_set = (poly_list[i][3].vertices[j].x, poly_list[i][3].vertices[j].y)
    #         point_list.append(point_set)
    #     poly_json_list.append(point_list)
    # return poly_json_list


def find_staves(num_lines=0, scanlines=20, blackness=0.8, tolerance=-1):
    #both 0's can be parameterized, first one is staffline_height and second is staffspace_height, both default 0
    staff_finder = musicstaves.StaffFinder_miyao(gam.load_image("static/images/testim.tiff"), 0, 0)
    staff_finder.find_staves(num_lines, scanlines, blackness, tolerance)
    poly_list = staff_finder.get_polygon()

    poly_json_list = __create_polygon_json_dict(poly_list)

    encoded = json.dumps(poly_json_list)

    output_file_name = "static/json_in/imdata.json"
    with open(output_file_name, "w") as f:
        f.write(encoded)


class RootHandler(tornado.web.RequestHandler):
    """
        Handles image uploading.
    """
    '''
        The following function is used to retrieve polygon points data of the first
        and last staff lines of a particular polygon that is drawn over a staff.
        Note that we iterate through the points of the last staff line in reverse (i.e starting
        from the last point on the last staff line going to the first) - We do this to simplify
        recreating the polygon on the front-end
    '''

    def get(self):
        find_staves()
        self.render("templates/index-new.html")

    def post(self):
        self.render("templates/index.html")


class ImageMaskHandler(tornado.web.RequestHandler):
    def get(self, thresh_method):
        #retrieve all relevant info
        t_value = self.get_argument("thresh_value", None)
        img_url_value = self.get_argument("img_url", None)

        gam.init_gamera()
        # simple_thresh_obj = threshold.threshold()
        # output_img = simple_thresh_obj(gam.load_image(img_url_value),int(t_value))
        # gam.save_image(output_img,"./static/resultimages/AntA_1520_1520.1_D.Mu_01_006_simpletresh" + t_value +".tiff")

        self.write(thresh_method)

    def post(self, thresh_method):
        #retrieve all relevant info
        json_value = self.get_argument("JSON", None)
        img_url_value = "./static/images/testim.tiff"

        json_data = json.loads(json_value)

        im = Image.open(img_url_value)
        mask = Image.new('1', im.size)
        mdraw = ImageDraw.Draw(mask)
        for poly in json_data:
            flatPoly = [j for i in poly for j in i]
            mdraw.polygon(flatPoly, outline=1, fill=1)
        out = ImageMath.eval("~(a - b)", a=im, b=mask)
        out.save("./static/resultimages/testout.tiff")
        #print out

        #print thresh_method

        gam.init_gamera()
        #simple_thresh_obj = threshold.threshold()
        #output_img = simple_thresh_obj(gam.load_image(img_url_value),int(t_value))
        #gam.save_image(output_img,"./static/resultimages/AntA_1520_1520.1_D.Mu_01_006_simpletresh" + t_value + ".tiff")

        #self.write(thresh_method)

settings = {
    "static_path": os.path.join(os.path.dirname(__file__), "static"),
    "debug": True,
    "cookie_secret": "secretlol",
}


def main():
    gam.init_gamera()
    tornado.options.parse_command_line()
    application = tornado.web.Application([(r"/", RootHandler), (r"/imagemask(.*?)", ImageMaskHandler)], **settings)
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(9000)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()
