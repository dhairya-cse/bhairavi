import numpy

class constants(object):
    CPN_SLOPE_THRESHOLD = 1
    CPN_MIN_DURATION = 0.08
    SILENCE_SEMI = -220
    CPN_THESHOLD_DELTA = 0.3 

class stateLabels(object):
    NOT_DEFINED = -5
    CPN = 1
    SIL = -4

def markCPNs(semitone,timestamp):
    i = 0    
    L = len(semitone)

    state = [stateLabels.NOT_DEFINED]*L

    CPNsegments = []
    CPNmeans = [stateLabels.NOT_DEFINED]*L

    for d in range(len(semitone)):
        if semitone[d]==constants.SILENCE_SEMI:
            state[d] = stateLabels.SIL


    while (i < L):
        minn = semitone[i]
        maxx = semitone[i]

        AY = semitone[i]
        AX = 0
        AXY = 0
        AXSquare = 0
        AYSquare = AY**2

        if state[i]==stateLabels.SIL:
            i+=1
            continue
        j = i+1

        while j < L and state[j] != stateLabels.SIL and abs(maxx-minn)<=2 * constants.CPN_THESHOLD_DELTA:
            minn = min(minn,semitone[j])
            maxx = max(maxx,semitone[j])
            AX +=  (j-i)
            AXSquare += (j-i)**2
            AY += semitone[j]
            AYSquare += semitone[i]**2
            AXY += (j-i) * semitone[i]

            cplen = j-i+1

            if cplen>=2:
                const = (AXY*AX - AXSquare*AY)/(AX*AX - cplen * AXSquare)
                slope = (AY - cplen*const) / AX
                fitted  = const + slope

                if abs(slope) > constants.CPN_SLOPE_THRESHOLD or abs(minn-fitted) > constants.CPN_THESHOLD_DELTA or abs(fitted-maxx) > constants.CPN_THESHOLD_DELTA:
                    break
#                 slope = abs((self.semitone[j]-self.semitone[i])/(self.timestamp[j]-self.timestamp[i]))
#                 if slope > constants.CPN_SLOPE_THRESHOLD:
#                     break
            j+=1

        if timestamp[j-1] - timestamp[i] >= constants.CPN_MIN_DURATION:
            l = j-i
            state[i:j]= [stateLabels.CPN]*l
            mean = sum(semitone[i:j])/l
            CPNmeans[i:j] = [mean]*l
            CPNsegments.append((i,j-1,mean))
        i = j

    for i in range(L):
        if state[i]==stateLabels.CPN:
            semitone[i] = round(CPNmeans[i])
    return semitone


def smoother(semi,timestamp,niter=3):
    semitone = numpy.array(semi)
    for _ in range(niter):
        semitone = markCPNs(semitone,timestamp)
    return semitone

