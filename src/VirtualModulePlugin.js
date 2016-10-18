import path from 'path'
import MemoryFileSystem from 'memory-fs';

import proxyFileSystem from './proxyFileSystem';

class VirtualModulePlugin {

  constructor(data) {
    this.fs = new MemoryFileSystem(data)
  }

  emitVirtualFile = (virtualPath, content) => {
    this.fs.mkdirpSync(path.dirname(virtualPath))
    this.fs.writeFileSync(virtualPath, content)
  }

  apply(compiler) {
    compiler.plugin('compile', () => {
      if (compiler.inputFileSystem.__isProxiedFileSystem)
        return;

      let fs = proxyFileSystem(compiler.inputFileSystem, this.fs)

      compiler.inputFileSystem = fs;
      compiler.resolvers.normal.fileSystem = fs;
      compiler.resolvers.context.fileSystem = fs;
      compiler.resolvers.loader.fileSystem = fs;
    })

    // Augment the loader context so that loaders can neatly
    // extract source strings to virtual files.
    compiler.plugin('compilation', compilation => compilation
      .plugin('normal-module-loader', loaderContext => {
        loaderContext.emitVirtualFile = this.emitVirtualFile
      })
    );
  }
}

export default VirtualModulePlugin