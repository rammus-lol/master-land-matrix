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

import { defineConfig } from 'vite';


export default defineConfig({
  server: {
    port: 5500,
    open: 'firefox',
  }
});