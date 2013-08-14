#!/usr/local/bin/python

import os

import tornado.httpserver
import tornado.ioloop
import tornado.web
from tornado.options import define, options
import Image

define("port", default=8888, help="run on the given port", type=int)


class RootHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("templates/index-new.html")

    def post(self):
        self.write("Post requests not supported.!\n")


class DespeckleHandler(tornado.web.RequestHandler):
    def post(self, *args, **kwargs):
        print "Received post, speckle_size: " + self.get_argument("speckle_size", None)


settings = {
    "static_path": os.path.join(os.path.dirname(__file__), "static"),
    "debug": True,
    "cookie_secret": "secretlol",
}


def main():
    tornado.options.parse_command_line()
    application = tornado.web.Application([
            (r"/", RootHandler), 
            (r"/interactive/despeckle(.*?)", DespeckleHandler)
            ], 
        **settings)
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()
