import { useValue } from 'tldraw'
import '../../styles/globals.css'
import { TlaEditor } from '../components-tla/TlaEditor'
import { useApp } from '../hooks/useAppState'

export function Component() {
	const app = useApp()
	const file = useValue(
		'most recent file',
		() => {
			const session = app.getSession()
			if (!session) return
			return app.getUserFiles(session.userId, session.workspaceId)[0]
		},
		[app]
	)
	if (!file) throw Error('File not found')

	return (
		<div className="tla_content">
			<TlaEditor file={file} />
		</div>
	)
}
