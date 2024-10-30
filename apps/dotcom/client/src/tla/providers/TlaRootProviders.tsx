import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { Provider as TooltipProvider } from '@radix-ui/react-tooltip'
import { getAssetUrlsByImport } from '@tldraw/assets/imports.vite'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import {
	ContainerProvider,
	EditorContext,
	TLUiEventHandler,
	TldrawUiContextProvider,
	TldrawUiDialogs,
	TldrawUiToasts,
	useValue,
} from 'tldraw'
import { globalEditor } from '../../utils/globalEditor'
import { components } from '../components/TlaEditor/TlaEditor'
import { AppStateProvider } from '../hooks/useAppState'
import { UserProvider } from '../hooks/useUser'
import '../styles/tla.css'
import { getLocalSessionState, updateLocalSessionState } from '../utils/local-session-state'
import { getRootPath } from '../utils/urls'

const assetUrls = getAssetUrlsByImport()

// @ts-ignore this is fine
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
	throw new Error('Missing Publishable Key')
}

export function Component() {
	const [container, setContainer] = useState<HTMLElement | null>(null)
	const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light')
	const handleThemeChange = (theme: 'light' | 'dark' | 'system') => setTheme(theme)

	return (
		<ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl={getRootPath()}>
			<SignedInProvider onThemeChange={handleThemeChange}>
				<div
					ref={setContainer}
					className={`tla tl-container tla-theme-container ${theme === 'light' ? 'tla-theme__light tl-theme__light' : 'tla-theme__dark tl-theme__dark'}`}
				>
					{container && (
						<ContainerProvider container={container}>
							<InsideOfContainerContext>
								<Outlet />
							</InsideOfContainerContext>
						</ContainerProvider>
					)}
				</div>
			</SignedInProvider>
		</ClerkProvider>
	)
}

function InsideOfContainerContext({ children }: { children: ReactNode }) {
	const handleAppLevelUiEvent = useCallback<TLUiEventHandler>(() => {
		// todo, implement handling ui events at the application layer
	}, [])
	const currentEditor = useValue('editor', () => globalEditor.get(), [])

	return (
		<EditorContext.Provider value={currentEditor}>
			<TldrawUiContextProvider
				assetUrls={assetUrls}
				components={components}
				onUiEvent={handleAppLevelUiEvent}
			>
				<TooltipProvider>{children}</TooltipProvider>
				<TldrawUiDialogs />
				<TldrawUiToasts />
			</TldrawUiContextProvider>
		</EditorContext.Provider>
	)
}

function SignedInProvider({
	children,
	onThemeChange,
}: {
	children: ReactNode
	onThemeChange(theme: 'light' | 'dark' | 'system'): void
}) {
	const auth = useAuth()

	useEffect(() => {
		if (auth.isSignedIn && auth.userId) {
			updateLocalSessionState(() => ({
				auth: { userId: auth.userId },
			}))
		} else {
			updateLocalSessionState(() => ({
				auth: undefined,
			}))
		}
	}, [auth.userId, auth.isSignedIn])

	if (!auth.isLoaded) return null

	if (!auth.isSignedIn) {
		return children
	}

	return (
		<AppStateProvider>
			<UserProvider>
				<ThemeContainer onThemeChange={onThemeChange}>{children}</ThemeContainer>
			</UserProvider>
		</AppStateProvider>
	)
}

function ThemeContainer({
	children,
	onThemeChange,
}: {
	children: ReactNode
	onThemeChange(theme: 'light' | 'dark' | 'system'): void
}) {
	const theme = useValue('theme', () => getLocalSessionState().theme, [])

	useEffect(() => {
		onThemeChange(theme)
	}, [theme, onThemeChange])

	return children
}
