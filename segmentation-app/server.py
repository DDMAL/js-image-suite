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

import gamera.core as gam
from gamera.plugins import threshold

define("port", default=8888, help="run on the given port", type=int)


class RootHandler(tornado.web.RequestHandler):
    """
        Handles image uploading.
    """
    def get(self):
        self.render("templates/index.html")

    def post(self):
        self.write("DON'T SEND POST REQUESTS!\n")

class BinarizeSimpleThresholdHandler(tornado.web.RequestHandler):
    def get(self, thresh_method):
        #retrieve all relevant info
        t_value = self.get_argument("thresh_value", None)
        img_url_value = self.get_argument("img_url", None)

        gam.init_gamera()
        simple_thresh_obj = threshold.threshold()
        output_img = simple_thresh_obj(gam.load_image(img_url_value),int(t_value))
        gam.save_image(output_img,"./static/resultimages/AntA_1520_1520.1_D.Mu_01_006_simpletresh" + t_value +".tiff")
        
        self.write(thresh_method)

    def post(self,thresh_method):
        #retrieve all relevant info
        t_value = self.get_argument("thresh_value", None)
        img_url_value = self.get_argument("img_url", None)

        print img_url_value
       
        gam.init_gamera()
        simple_thresh_obj = threshold.threshold()
        output_img = simple_thresh_obj(gam.load_image(img_url_value),int(t_value))
        gam.save_image(output_img,"./static/resultimages/AntA_1520_1520.1_D.Mu_01_006_simpletresh" + t_value + ".tiff")

        self.write(thresh_method)

class BinarizeAbutalebThresholdHandler(tornado.web.RequestHandler):
    def get(self, thresh_method):
        t_value = self.get_argument("thresh_value", None)
        print t_value
        self.write(thresh_method)

    def post(self,thresh_method):
        t_value = self.get_argument("thresh_value", None)
        print t_value
        self.write(thresh_method)

        
settings = {
    "static_path": os.path.join(os.path.dirname(__file__), "static"),
    "debug": True,
    "cookie_secret": "secretlol",
}

def main():
    #gam.init_gamera()
    tornado.options.parse_command_line()
    application = tornado.web.Application([
                                           (r"/", RootHandler),
                                            (r"/binarize/simplethreshold(.*?)", BinarizeSimpleThresholdHandler),
                                            (r"/binarize/abutaleb(.*?)", BinarizeAbutalebThresholdHandler),
                                           ], **settings)
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()

