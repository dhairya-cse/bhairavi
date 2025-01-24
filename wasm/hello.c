#include <stdio.h>
int myFunction(int argc,char **argv) {
    for(int i=0;i<argc;i++)
    {
        printf("%d: %s\n",i,argv[i]);
    }
    return 0;
}