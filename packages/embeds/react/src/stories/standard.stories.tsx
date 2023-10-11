import { Standard } from '..'
import { leadGenerationProbot } from './assets/leadGenerationProbot'

export const Default = () => {
  return (
    <div style={{ height: '500px' }}>
      <Standard
        probot={leadGenerationProbot}
        apiHost="http://localhost:3001"
        isPreview
      />
    </div>
  )
}

export const StartWhenIntoView = () => {
  return (
    <>
      <div style={{ height: '300vh' }} />
      <Standard
        probot={leadGenerationProbot}
        apiHost="http://localhost:3001"
        isPreview
        style={{ height: '300px' }}
      />
    </>
  )
}
