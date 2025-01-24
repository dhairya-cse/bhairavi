# Creates a list of packages installed in the current virtual environment.
# The file in requirment.txt can then be used to create a new virtual environment
# python version = 3.8.8
# This script is not needed at development server.



from os import system
from os.path import join, dirname

HOME = dirname(__file__)
REQUIREMENT_FILE = join(HOME,'requirement.txt')
command = f"pip list --format=freeze > {REQUIREMENT_FILE}"
system(command)