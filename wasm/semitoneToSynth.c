#include<stdio.h>
#include<stdlib.h>
#include<math.h>
#include<assert.h>
#include<malloc.h>

#define MAX_FILE_LENGTH 1000
#define RATE 32000
#define SILENCE_SEMITONE -220

#define true 1;
#define false 0;
typedef int bool;



int semitoneToSynth(int argc,char **argv)
{
    if(argc!=5)
    {
        printf("Usage: pitchTosynth [pitchFileName] [engergyFileName] [outputFileName] [tonic (in Hz)]\n");
        exit(-1);
    }

    double dt = 1.0/RATE;
    double t = 0;
    bool stop = true;

    FILE *pitchHandle = fopen(argv[1], "r");

    if ( pitchHandle == NULL )
    {
        fprintf(stderr,"ERROR READING FILE %s\n", argv[1]);
        exit(-1);
    }

    FILE *energyHandle = fopen(argv[2], "r");
    
    if ( energyHandle == NULL )
    {
        fprintf(stderr,"ERROR READING FILE %s\n", argv[2]);
        exit(-1);
    }
    
    FILE *opHandle = fopen(argv[3], "w");

    if ( opHandle == NULL )
    {
        fprintf(stderr,"Couldn't write Output File\n");
        exit(-1);
    }

    double tonic;  
    tonic = atof(argv[4]);

    double time,pitch;

    while(fscanf(pitchHandle,"%lf %lf",&time,&pitch)>0)
    {
        if(pitch==SILENCE_SEMITONE)
        {
            fprintf(opHandle,"%lf %lf %lf\n",time,0.0,0.0);
        }
        else
        {
            pitch = pow(2,pitch/12.0)*tonic;
            fprintf(opHandle,"%lf %lf %lf\n",time,pitch,1.0);
        }
    }
    
    fclose(pitchHandle);
    fclose(energyHandle);
    fclose(opHandle);
    return 0;
}
