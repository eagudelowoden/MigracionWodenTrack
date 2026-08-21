export default {
  plugins: {
    '@tailwindcss/postcss': {},
    // autoprefixer ya no hace falta en v4: el motor interno (Lightning CSS)
    // se encarga del prefijado de vendors.
  },
}