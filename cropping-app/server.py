#!/usr/local/bin/python

"""
    Binarization application using Tornado and Gamera
    """

import os
import logging
from random import randint

import tornado.httpserver
import tornado.ioloop
import tornado.web
from tornado.options import define, options

from PIL import Image, ImageDraw, ImageMath
import json
import gamera.core as gam
from gamera.plugins import segmentation
from gamera.toolkits import musicstaves

define("port", default=8888, help="run on the given port", type=int)


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
        self.render("templates/index.html")

    def post(self):
        self.render("templates/index.html")

class ImageMaskHandler(tornado.web.RequestHandler):
    def get(self, thresh_method):
        #retrieve all relevant info
        t_value = self.get_argument("thresh_value", None)
        img_url_value = self.get_argument("img_url", None)

        gam.init_gamera()
        simple_thresh_obj = threshold.threshold()
        output_img = simple_thresh_obj(gam.load_image(img_url_value),int(t_value))
        gam.save_image(output_img,"./static/resultimages/AntA_1520_1520.1_D.Mu_01_006_simpletresh" + t_value +".tiff")
        
        self.write(thresh_method)

    def post(self, thresh_method):
        #retrieve all relevant info
        json_value = self.get_argument("JSON", None)
        img_url_value = "./static/images/testim.tiff"
        
        json_data = json.loads(json_value)
        print json_data
        im = Image.open(img_url_value)
        mask = Image.new('1', im.size)
        mdraw = ImageDraw.Draw(mask)
        flat_data = [j for i in json_data for j in i]
        mdraw.rectangle(flat_data, outline=1, fill=1)
        out = ImageMath.eval("~(a - b)", a = im, b=mask)
        out.save("./static/resultimages/testout.tiff")
        #print out

        #print thresh_method
       
        #gam.init_gamera()
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
    application = tornado.web.Application([
                                           (r"/", RootHandler),
                                            (r"/imagemask(.*?)", ImageMaskHandler),
                                           ], **settings)
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()

