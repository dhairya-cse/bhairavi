'''
This sets up the environment for the application deployment.
'''
from os.path import dirname, join
import sys


#A very important piece of code for relative imports
HOME = dirname(__file__)
sys.path.append(join(HOME,".."))

from scripts.utility import *

# contains the required command line tools
required_tools = ["conda","git"]
required_packages = ["flask","spleeter","ftransc"]


#Tweaks
ENV_NAME = "tempenv"        #TODO: Change to hemavati (put a unique name for the virtual enviroment)
PYTHON_VER = "3.8.8"

    
def create_conda_environment():
    '''
    Creates conda environment with specified by ENV_NAME variable.
    And Intall the python packages specified in the requriement.txt.
    '''
    if check_conda_env(ENV_NAME):
        print("Virtual Env %s already created"%ENV_NAME)
    else:
        print("Creating conda environment %s"%ENV_NAME)
        run_process("conda create -n %s python=%s"%(ENV_NAME,PYTHON_VER))
    
    print("Installing the requirements")
    REQUIREMENT_FILE = join(HOME,'requirement.txt')
    run_process(f"{get_interpreter(ENV_NAME)} -m pip install -r {REQUIREMENT_FILE}")
    if not tool_executable_in_conda(ENV_NAME,'ffmpeg'):
        run_process(f"conda install -n {ENV_NAME} ffmpeg")
    else:
        print("ffmpeg is already installed")

    run_process(f"conda activate {ENV_NAME}")
    # run_process(f"conda install -n {ENV_NAME} tesnorflow==2.3.0")
    # run_process(f"{get_interpreter(ENV_NAME)} -m pip install spleeter")
    # run_process(f"{get_interpreter(ENV_NAME)} -m pip install numpy==1.18.5")
    # run_process(f"{get_interpreter(ENV_NAME)} -m pip install essentia")

    print("Conda enviroment is established with all the requried dependencies")
    print(f"run `conda activate {ENV_NAME}` to activate the environment")


def main():
    check_depenencies(required_tools)
    create_conda_environment()

if __name__ == "__main__":
    main()