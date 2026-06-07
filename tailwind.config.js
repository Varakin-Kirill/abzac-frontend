/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: "class",
	content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
	presets: [require("nativewind/preset")],
	theme: {
		extend: {
			fontFamily: {
				rubik: ["Rubik", "sans-serif"],
				rubikRegular: ["Rubik-Regular", "sans-serif"],
				rubikBold: ["Rubik-Bold", "sans-serif"],
				rubikItalic: ["Rubik-Italic", "sans-serif"],
				rubikSemiBold: ["Rubik-SemiBold", "sans-serif"],
				rubikMedium: ["Rubik-Medium", "sans-serif"],
				rubikExtraBold: ["Rubik-ExtraBold", "sans-serif"],
				rubikBlack: ["Rubik-Black", "sans-serif"],
			},
			colors: {
				main: {
					gray: "#212529",
					brand: "#F03A52",
					graySecond: "#495057",
					textSecond: "#8E959C",
				},
			},
		},
	},
	plugins: [],
};
