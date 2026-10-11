type Props={size?:'sm'|'md'|'lg';withText?:boolean;inverse?:boolean;className?:string};
export default function BrandLockup({size='md',withText=true,inverse=false,className=''}:Props){
  return <div className={'scoolabs-lockup scoolabs-lockup--'+size+(inverse?' scoolabs-lockup--inverse':'')+' '+className}>
    <img className="scoolabs-lockup-icon" src="/brand/scoolabs-mark.svg" width="52" height="52" alt="" aria-hidden="true"/>
    {withText&&<div className="scoolabs-lockup-words"><strong>Scoo<span>labs</span></strong><small>VIRTUAL SCIENCE LABORATORY</small></div>}
  </div>;
}
