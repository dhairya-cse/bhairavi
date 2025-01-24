"""
This file contains functions which can be used for my future projects.
These functions are independent of the project and doesn't depend on any global variable.
i.e. all imports are local to the function and they follow message passing model.
"""

from datetime import datetime

def tool_executable(name):
    """Check whether `name` is on PATH and marked as executable."""
    from shutil import which
    return which(name) is not None

def run_process(cmd,wait_for=True):
    """Runs a process in the current shell"""
    from os import system
    import subprocess
    if wait_for == True:
        print(f"{datetime.now().ctime()} running: {cmd}")
        exit_code = system(cmd)
        if exit_code==127:
            eprint("Couldn't run: %s"%cmd)
            exit(exit_code)
        
        if exit_code!=0:
            eprint("Something went wrong while running: %s"%cmd)
            exit(exit_code)
    
    else:
        subprocess.Popen(cmd.split())
        print(f"running: {cmd}")

# Get the absolute path from given path relative to the current file
def abspath(currpath):
    from os import path
    HOME = path.abspath(path.dirname(f"{__file__}"))
    return path.abspath(path.join(HOME,currpath))


@DeprecationWarning
def run_in_conda_env(cmd,env):
    """Runs a process in a conda environment. 
    CAUTION: The output is returned after the process is complted"""

    run_process("conda run -n %s %s"%(env,cmd))

def run_script_in_conda_env(env,file):
    """
    Runs a python script in a conda environment.
    """
    run_process(f"{get_interpreter(env)} {file}")


def check_conda_env(env):
    ''' Checks if conda environment is already created or not'''
    from os import system
    exit_code = system("conda run -n %s"%env)
    return exit_code==0

def tool_executable_in_conda(env,tool):
    from os import system
    exit_code = system(f"conda run -n {env} which {tool}")

def get_interpreter(env):
    """Gets path of the python interpreter for the current environment"""
    import subprocess
    command = f"conda run -n {env} which python"
    out =  subprocess.run(command.split(),capture_output=True,text=True)
    res = out.stdout.strip()
    if out.returncode != 0 or len(res)==0:
        raise Exception(f"Couldn't find a python executable for the enviornment {env}")
    return res

def eprint(*args, **kwargs):
    """prints to the stderr"""
    from sys import stderr
    print(datetime.now().ctime(),*args, file=stderr, **kwargs)


def check_depenencies(required_tools):
    """
    Checks whether or not the dependencies are installed
    Dosen't check for the version information.
    The dependencies should be added to the PATH.
    """
    from io import StringIO
    all_ok = True
    string_writer = StringIO()
    template = "%s\n"
    for tool_name in required_tools:
        if tool_executable(tool_name)==False:
            all_ok = False
            string_writer.write(template%tool_name)
            

    if not all_ok:
        eprint("The following dependencies are not installed")
        eprint(string_writer.getvalue(),end="")
        eprint("Please install the above and make sure they are added to PATH")
        exit(-1)
