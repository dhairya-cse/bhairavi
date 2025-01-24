
from flask import Flask,flash,render_template
from flask_compress import Compress
from colored_print import log
import os

# Information logging on terminal

logger = log

# Project globals
DEBUG = True
CACHE_TIMEOUT = 3600

ENABLE_REGISTER = True

# Get the absolute path from given path relative to the current file
def abspath(currpath):
    from os import path
    HOME = path.abspath(path.dirname(f"{__name__}"))
    return path.abspath(path.join(HOME,currpath))

flash_messsages =  {
    404:"The requested resource not found",
    500:"Internal server error",
}


def create_app():
    app = Flask(__name__)

    # Configuring the application

    if DEBUG:
        app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
    else:
        app.config['SEND_FILE_MAX_AGE_DEFAULT'] = CACHE_TIMEOUT

    app.config['TEMPLATES_AUTO_RELOAD'] = True
    app.jinja_env.add_extension('jinja2.ext.do')

    # Initializing the flask extensions
    Compress(app)

    from .views import main as main_blueprint
    app.register_blueprint(main_blueprint)

    @app.errorhandler(404)
    @app.errorhandler(500)
    def pageNotFound(error):
        flash(flash_messsages[error.code])
        return render_template("error.html",error=error),error.code

    return app