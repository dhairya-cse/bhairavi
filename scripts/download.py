# first sudo snap install drive and init drive

import os
from os import path
import glob
import re
import shutil

links ='''
https://drive.google.com/drive/folders/0Bz-I9QJ1cL6aVW14WUNIUmt6ZnM?resourcekey=0-i6owHmDUEmZdLiYnYDtsgA&usp=sharing
https://drive.google.com/drive/folders/0Bz-I9QJ1cL6aNXNReG00Y3g4UUU?resourcekey=0-_weMQBFfS6rQfsi6QgquLA&usp=sharing
https://drive.google.com/drive/folders/0Bz-I9QJ1cL6aSEdHdmJ2S3BiX0E?resourcekey=0-1HoQCwwWr8oyuwgeBi338A&usp=sharing
https://drive.google.com/drive/folders/0Bz-I9QJ1cL6aN1c1UDctTWJ2b1k?resourcekey=0-VPMDFg72E9lK63wi4XG-Lg&usp=sharing
https://drive.google.com/drive/folders/0Bz-I9QJ1cL6aOW15REJTQUNVaUU?resourcekey=0-IHBcRdbutV-Ag-kl1SFn0w&usp=sharing
https://drive.google.com/drive/folders/0Bz-I9QJ1cL6aM3RIcDBveUw2MEE?resourcekey=0-Qy8ATTSyDtErLRr_StP0bg&usp=sharing
https://drive.google.com/drive/folders/0Bz-I9QJ1cL6aUVFFZnN2b2U1aGc?resourcekey=0-B7BuhJu_y2iglAMBlHrBqw&usp=sharing
https://drive.google.com/drive/folders/0Bz-I9QJ1cL6abXlhZkJ3aG1rTTQ?resourcekey=0-bJgWNKhmQuCDjzeQI3nSOg&usp=sharing
https://drive.google.com/drive/folders/0Bz-I9QJ1cL6aaHlPVTI4aFRSR28?resourcekey=0-XwRIe6gu5jnHDlJ3Jl8mUQ&usp=sharing
https://drive.google.com/drive/folders/0Bz-I9QJ1cL6aNGFMMmV6cWJxNVk?resourcekey=0-Z_1InIb6VGzdR0tOL7p23g&usp=sharing
https://drive.google.com/drive/folders/0Bz-I9QJ1cL6aMENTcGZLZy1FbEU?resourcekey=0-B4SlWJfQgyDWlXmDz2pSuA&usp=sharing
https://drive.google.com/drive/folders/0Bz-I9QJ1cL6aWlE1NldvV1pqNVE?resourcekey=0-I6bEInnewBETZ5_nGzuhcg&usp=sharing
https://drive.google.com/drive/folders/0Bz-I9QJ1cL6aTmNlWHY0Q3dXYTQ?resourcekey=0-aVF5rhI4eU1NDSk2JVnwqA&usp=sharing
https://drive.google.com/drive/folders/0Bz-I9QJ1cL6aNXNReG00Y3g4UUU?resourcekey=0-_weMQBFfS6rQfsi6QgquLA&usp=sharing
https://drive.google.com/drive/folders/0Bz-I9QJ1cL6abmVQSmhCSGNaR0U?resourcekey=0-lbKshFbksncTRdHU-NPOSw&usp=sharing
https://drive.google.com/drive/folders/0Bz-I9QJ1cL6aUkhZa244N2lJdW8?resourcekey=0-A_lGT9uAHBrdgtKvkxuWMw&usp=sharing
https://drive.google.com/drive/folders/0Bz-I9QJ1cL6aSW9UaDVfR3VjbzQ?resourcekey=0-NoBV2NMOxMDp7_-HO1vRGw&usp=sharing
https://drive.google.com/drive/folders/0Bz-I9QJ1cL6aZnlvOVpUYVF4blk?resourcekey=0-8JnvqitliXaEEXVAArHIqA&usp=sharing
https://drive.google.com/drive/folders/0Bz-I9QJ1cL6aYzJJOTRHdEJxbU0?resourcekey=0-Gg4AEXVCN5SeWZIdaP7hVA&usp=sharing
https://drive.google.com/drive/folders/0Bz-I9QJ1cL6aTEdzZFl2amQxUXc?resourcekey=0-oQJ6q6-Lg2YiztqW02XNew&usp=sharing
https://drive.google.com/drive/folders/0Bz-I9QJ1cL6aVkxIU1oxZmFuWms?resourcekey=0-eGjPdatlLeHRaQtG6Uhyfw&usp=sharing
https://drive.google.com/drive/folders/0Bz-I9QJ1cL6aVW14WUNIUmt6ZnM?resourcekey=0-i6owHmDUEmZdLiYnYDtsgA&usp=sharing
'''.strip().split()

match = re.compile("https://drive.google.com/drive/folders/(?P<id>.*)\\?.*")

def urlToFileId(url):
    try:
        res = match.search(url)
        return res.group('id')
    except:
        return None

def abspath(currpath):
    from os import path
    HOME = path.abspath(path.dirname(f"{__file__}"))
    return path.abspath(path.join(HOME,currpath))


gdrive = abspath('../Data/gdrive')


folderids = " ".join(filter(lambda x:x!=None,map(urlToFileId,links)))

os.chdir(gdrive)
# os.system(f"drive pull -force -id {folderids}")
copyTo = abspath("../../SongDB")

print(copyTo)
for file in glob.glob("*/*/*/*/*.mp3"):
    folders = file.split("/")
    newpath = f"{copyTo}/{folders[1]}/{folders[3]}"
    os.makedirs(newpath,exist_ok=True)
    if(os.path.exists(path.join(newpath,folders[-1])) or os.path.exists(path.join(newpath,"song.mp3"))):
        pass
    else:
        shutil.copy(file,path.join(newpath,folders[-1]))

