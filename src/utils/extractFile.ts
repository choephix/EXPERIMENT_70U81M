export function extractFile(e: React.DragEvent): Promise<File> {
  e.preventDefault();

  return new Promise((resolve, reject) => {
    if (e.dataTransfer.items) {
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        if (item.kind === "file") {
          const file = item.getAsFile();
          if(file){
            resolve(file);
          }
        }
      }
    } else {
      reject();
    }
  });
}
