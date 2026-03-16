/*
 * Copyright (c) 2026, Land Matrix Geodata Visualiser
 * All rights reserved.
 * 
 * This software is governed by the CeCILL license under French law and
 * abiding by the rules of distribution of free software.  You can  use, 
 * modify and/ or redistribute the software under the terms of the CeCILL
 * license as circulated by CEA, CNRS and INRIA at the following URL
 * "http://www.cecill.info".
 */

import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: {
    host: true,
    allowedHosts: [
      'landmatrix.artxypro.org'
    ]
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        maps: resolve(__dirname, 'maps.html'),
        documentation: resolve(__dirname, 'documentation.html')
      }
    },
    commonjsOptions: {
      ignoreDynamicRequires: true
    }
  },
  optimizeDeps: {
    include: ['sql.js'],
    exclude: []
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true
  },
  appType: 'mpa'
})