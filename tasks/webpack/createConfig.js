const path = require('path')
const StringReplacePlugin = require('string-replace-webpack-plugin')

// `CheckerPlugin` is optional. Use it if you want async error reporting.
// We need this plugin to detect a `--watch` mode. It may be removed later
// after https://github.com/webpack/webpack/issues/3460 will be resolved.
const { CheckerPlugin } = require('awesome-typescript-loader')

// external configs
const packageConf = require('../../package.json')

/*
settings:
	entry: { modulename: path }
	tsconfig: string
	useExternalCore: true / false (default)
	debug: true / false (default)
*/
module.exports = function(/* settings, settings, settings */) {
	const settings = Object.assign.apply(Object, [{}].concat(Array.prototype.slice.call(arguments)))
	const externals = {
		jquery: {
			commonjs: 'jquery',
			commonjs2: 'jquery',
			amd: 'jquery',
			root: 'jQuery'
		},
		moment: 'moment'
	}
	const output = {
		libraryTarget: 'umd',
		filename: '[name].js',
		path: path.resolve(__dirname, '../../dist/'),
		devtoolModuleFilenameTemplate: 'webpack:///' + packageConf.name + '/[resource-path]'
	}

	if (!settings.useExternalCore) {
		output.library = 'FullCalendar';
	} else {
		externals.fullcalendar = {
			commonjs: 'fullcalendar',
			commonjs2: 'fullcalendar',
			amd: 'fullcalendar',
			root: 'FullCalendar'
		}
	}

	return {
		entry: settings.entry || {},

		resolve: {
			extensions: ['.ts', '.js'],
			alias: {
				// use our slimmed down version
				// still need to npm-install the original though, for typescript transpiler
				tslib: path.resolve(__dirname, '../../src/tslib-lite.js')
			}
		},

		module: {
			loaders: [
				{
					test: /\.ts$/,
					loader: 'awesome-typescript-loader',
					options: {
						configFileName: settings.tsconfig || null
					}
				},
				{
					test: /\.ts$/,
					loader: StringReplacePlugin.replace({
						replacements: [
							{
								pattern: /<%=\s*(\w+)\s*%>/g,
								replacement: function(match, p1) {
									return packageConf[p1];
								}
							}
						]
					})
				}
			]
		},

		plugins: [
			new CheckerPlugin(),
			new StringReplacePlugin()
		],

		externals: externals,
		devtool: settings.debug ? 'source-map' : false, // also 'inline-source-map'
		watch: settings.watch || false,
		output: output
	}
}
